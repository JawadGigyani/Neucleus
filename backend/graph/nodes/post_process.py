"""Post-process node: merges all outputs, calculates grounding scores, builds final plan."""

import re
import time
from datetime import datetime, timezone
from graph.state import AgentState
from lib.llm import MODELS
from schemas.complete_plan import CompletePlan, PlanMetadata, GroundingSummary
from schemas.novelty import NoveltyClassification, NoveltySignal, NoveltyReference

URL_RE = re.compile(r'https?://[^\s|"\'>,]+')


def _enrich_protocol_sources(protocol, grounding_scores):
    """Patch protocol step sources with real URLs from grounding matched_source."""
    if not protocol or not grounding_scores:
        return
    for g in grounding_scores:
        if not g.matched_source:
            continue
        url_match = URL_RE.search(g.matched_source)
        if not url_match:
            continue
        url = url_match.group(0).rstrip(".")
        for step in protocol.steps:
            if step.step_number != g.step_number:
                continue
            if "http" in step.source:
                break
            title = g.matched_source.replace(url, "").strip(" |:-")
            step.source = f"{title} | {url}" if title else url
            break


async def post_process_node(state: AgentState) -> dict:
    start = time.time()

    hypothesis = state.get("hypothesis", "")
    parsed = state.get("parsed_hypothesis")
    novelty = state.get("novelty")
    protocol = state.get("protocol")
    protocol_grounding = state.get("protocol_grounding", [])

    _enrich_protocol_sources(protocol, protocol_grounding)
    materials = state.get("materials", [])
    equipment = state.get("equipment", [])
    budget = state.get("budget")
    timeline = state.get("timeline")
    validation = state.get("validation")
    prior_feedback = state.get("prior_feedback", [])
    stage_durations = state.get("stage_durations", {})

    # Calculate grounding percentages
    proto_high = sum(1 for g in protocol_grounding if g.grounding_score == "HIGH")
    proto_total = len(protocol_grounding) or 1
    protocol_grounding_pct = (proto_high / proto_total) * 100

    mat_verified = sum(1 for m in materials if m.verification_status in ("VERIFIED", "CORRECTED"))
    mat_partial = sum(1 for m in materials if m.verification_status == "PARTIALLY_VERIFIED")
    mat_total = len(materials) or 1
    materials_verified_pct = ((mat_verified + mat_partial * 0.5) / mat_total) * 100

    budget_verified_pct = budget.summary.verified_percentage if budget else 0.0

    overall = (
        protocol_grounding_pct * 0.4
        + materials_verified_pct * 0.3
        + budget_verified_pct * 0.2
        + (50.0 if novelty and novelty.references else 0.0) * 0.1
    )

    grounding = GroundingSummary(
        protocol_grounding_pct=round(protocol_grounding_pct, 1),
        materials_verified_pct=round(materials_verified_pct, 1),
        budget_verified_pct=round(budget_verified_pct, 1),
        overall_grounding_pct=round(overall, 1),
    )

    total_duration = sum(stage_durations.values())

    if not novelty:
        novelty = NoveltyClassification(
            novelty_signal=NoveltySignal.NOT_FOUND,
            references=[NoveltyReference(title="N/A", url="", relevance="No novelty check performed", source="fallback")],
            reasoning="Novelty classification was not completed.",
        )

    if not parsed:
        from schemas.hypothesis import ParsedHypothesis
        parsed = ParsedHypothesis(key_terms=["unknown"], domain="unknown")

    feedback_ids = [fid for f in prior_feedback if f.get("sections") for fid in [f.get("feedback_id")] if fid]
    print(f"[PostProcess] prior_feedback count={len(prior_feedback)}, feedback_ids={feedback_ids}")

    metadata = PlanMetadata(
        hypothesis=hypothesis,
        parsed=parsed,
        novelty=novelty,
        generated_at=datetime.now(timezone.utc).isoformat(),
        generation_time_seconds=round(total_duration, 1),
        grounding_summary=grounding,
        models_used=MODELS,
        feedback_applied=feedback_ids,
    )

    plan = CompletePlan(
        metadata=metadata,
        protocol=protocol,
        protocol_grounding=protocol_grounding,
        materials=materials,
        equipment=equipment,
        budget=budget,
        timeline=timeline,
        validation=validation,
    )

    duration = time.time() - start
    print(f"[PostProcess] Grounding: {overall:.1f}% overall in {duration:.1f}s")
    print(f"[PostProcess] Total pipeline: {total_duration:.1f}s")

    return {
        "final_plan": plan,
        "current_stage": "complete",
        "stage_durations": {**stage_durations, "post_process": duration},
    }
