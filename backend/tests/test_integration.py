"""Integration test: runs the full pipeline on Sample Input 1 (CRP biosensor).

Requires .env with FEATHERLESS_API_KEY and TAVILY_API_KEY.
Run: python tests/test_integration.py
"""

import asyncio
import os
import sys
import time
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv()

SAMPLE_HYPOTHESES = {
    "diagnostics": (
        "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies "
        "will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L "
        "within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing."
    ),
    "gut_health": (
        "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce "
        "intestinal permeability by at least 30% compared to controls, measured by FITC-dextran "
        "assay, due to upregulation of tight junction proteins claudin-1 and occludin."
    ),
    "cell_biology": (
        "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase "
        "post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard "
        "DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures."
    ),
    "climate": (
        "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of "
        "-400mV vs SHE will fix CO2 into acetate at a rate of at least 150 mmol/L/day, outperforming "
        "current biocatalytic carbon capture benchmarks by at least 20%."
    ),
}


async def test_full_pipeline(hypothesis_key: str = "diagnostics"):
    from graph.graph import compile_graph
    from db.database import init_db

    await init_db()

    hypothesis = SAMPLE_HYPOTHESES[hypothesis_key]
    print(f"\n{'='*70}")
    print(f"FULL PIPELINE TEST: {hypothesis_key}")
    print(f"{'='*70}")
    print(f"Hypothesis: {hypothesis[:100]}...")

    graph = compile_graph()
    start = time.time()

    stages_seen = []
    final_state = None

    async for event in graph.astream(
        {"hypothesis": hypothesis, "errors": [], "stage_durations": {}},
        stream_mode="updates",
    ):
        for node_name, node_output in event.items():
            stage = node_output.get("current_stage", node_name)
            duration = node_output.get("stage_durations", {}).get(node_name, 0)
            stages_seen.append(node_name)

            errors = node_output.get("errors", [])
            error_flag = f" [ERRORS: {errors}]" if errors else ""

            print(f"  [{node_name}] -> {stage} ({duration:.1f}s){error_flag}")

            if "final_plan" in node_output:
                final_state = node_output

    total = time.time() - start
    print(f"\nTotal pipeline time: {total:.1f}s")
    print(f"Stages completed: {stages_seen}")

    if final_state and "final_plan" in final_state:
        plan = final_state["final_plan"]
        meta = plan.metadata
        print(f"\n--- RESULTS ---")
        print(f"Novelty: {meta.novelty.novelty_signal.value}")
        print(f"  References: {len(meta.novelty.references)}")
        for ref in meta.novelty.references:
            print(f"    - {ref.title[:60]}... ({ref.source})")
        print(f"  Reasoning: {meta.novelty.reasoning[:150]}...")

        if plan.protocol:
            print(f"\nProtocol: {plan.protocol.title}")
            print(f"  Steps: {len(plan.protocol.steps)}")
            for s in plan.protocol.steps[:3]:
                print(f"    {s.step_number}. {s.title} ({s.duration})")
            if len(plan.protocol.steps) > 3:
                print(f"    ... and {len(plan.protocol.steps) - 3} more steps")

        print(f"\nMaterials: {len(plan.materials)} items")
        verified = sum(1 for m in plan.materials if m.verification_status == "VERIFIED")
        print(f"  Verified: {verified}/{len(plan.materials)}")

        if plan.budget:
            print(f"\nBudget: {plan.budget.summary.total_estimate}")

        if plan.timeline:
            print(f"\nTimeline: {plan.timeline.total_duration}")
            for p in plan.timeline.phases:
                print(f"  Phase {p.phase}: {p.name} ({p.duration})")

        print(f"\nGrounding: {meta.grounding_summary.overall_grounding_pct}%")
        print(f"  Protocol: {meta.grounding_summary.protocol_grounding_pct}%")
        print(f"  Materials: {meta.grounding_summary.materials_verified_pct}%")

        if meta.feedback_applied:
            print(f"\nFeedback applied: {meta.feedback_applied}")

        # Save result to file
        output_path = os.path.join(os.path.dirname(__file__), f"output_{hypothesis_key}.json")
        with open(output_path, "w") as f:
            json.dump(plan.model_dump(), f, indent=2, default=str)
        print(f"\nFull plan saved to: {output_path}")

        return True
    else:
        print("\nFAILED: No final plan produced")
        return False


async def main():
    key = sys.argv[1] if len(sys.argv) > 1 else "diagnostics"

    if not os.getenv("FEATHERLESS_API_KEY"):
        print("ERROR: FEATHERLESS_API_KEY not set in .env")
        print("Create backend/.env with your API keys (see .env.example)")
        return

    if not os.getenv("TAVILY_API_KEY"):
        print("WARNING: TAVILY_API_KEY not set — Tavily searches will fail")

    if key == "all":
        for k in SAMPLE_HYPOTHESES:
            await test_full_pipeline(k)
    else:
        await test_full_pipeline(key)


if __name__ == "__main__":
    asyncio.run(main())
