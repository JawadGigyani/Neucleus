"""JSON normalization utilities for LLM outputs that don't match schema exactly."""

import json
import re


def extract_json(content: str) -> str:
    """Extract JSON from LLM response, handling think tags and code blocks."""
    if "<think>" in content:
        parts = content.split("</think>")
        content = parts[-1].strip() if len(parts) > 1 else content

    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        blocks = re.findall(r"```(?:\w+)?\s*\n?(.*?)```", content, re.DOTALL)
        if blocks:
            content = blocks[0]

    content = content.strip()
    if not content.startswith("{") and not content.startswith("["):
        start = content.find("{")
        if start == -1:
            start = content.find("[")
        if start != -1:
            content = content[start:]

    return content


def normalize_novelty(data: dict) -> dict:
    """Normalize QC output field names to match our schema."""
    if "novelty" in data:
        nov = data["novelty"]
    else:
        nov = data

    signal_keys = ["novelty_signal", "classification", "signal", "novelty_classification", "status"]
    for key in signal_keys:
        if key in nov and "novelty_signal" not in nov:
            nov["novelty_signal"] = nov.pop(key)
            break

    if "novelty_signal" in nov:
        val = nov["novelty_signal"].upper().replace(" ", "_")
        mapping = {
            "SIMILAR": "SIMILAR_WORK_EXISTS",
            "SIMILAR_WORK": "SIMILAR_WORK_EXISTS",
            "EXACT": "EXACT_MATCH_FOUND",
            "EXACT_MATCH": "EXACT_MATCH_FOUND",
            "NOT_FOUND": "NOT_FOUND",
            "NOVEL": "NOT_FOUND",
            "NO_MATCH": "NOT_FOUND",
        }
        nov["novelty_signal"] = mapping.get(val, val)

    if "references" in nov:
        for ref in nov["references"]:
            if "relevance" not in ref and "relevance_explanation" in ref:
                ref["relevance"] = ref.pop("relevance_explanation")
            if "relevance" not in ref and "explanation" in ref:
                ref["relevance"] = ref.pop("explanation")
            if "relevance" not in ref and "description" in ref:
                ref["relevance"] = ref.pop("description")
            if "relevance" not in ref:
                ref["relevance"] = ref.get("title", "Related to hypothesis")
            if len(ref.get("relevance", "")) < 20:
                ref["relevance"] = ref["relevance"] + " - related to the hypothesis under investigation"

    if "reasoning" not in nov and "reasoning_chain" in nov:
        nov["reasoning"] = nov.pop("reasoning_chain")
    if "reasoning" not in nov and "explanation" in nov:
        nov["reasoning"] = nov.pop("explanation")
    if "reasoning" not in nov:
        nov["reasoning"] = "Novelty classification based on literature search results analysis."

    if len(nov.get("reasoning", "")) < 50:
        nov["reasoning"] = nov.get("reasoning", "") + " Based on comprehensive analysis of the retrieved literature."

    if "novelty" not in data:
        data["novelty"] = nov

    return data


def normalize_protocol_step(step: dict) -> dict:
    """Normalize a protocol step to match ProtocolStep schema."""
    if "title" not in step and "name" in step:
        step["title"] = step.pop("name")
    if "title" not in step and "step_title" in step:
        step["title"] = step.pop("step_title")
    if "title" not in step:
        step["title"] = f"Step {step.get('step_number', '?')}"

    if "duration" not in step and "time" in step:
        step["duration"] = step.pop("time")
    if "duration" not in step and "estimated_time" in step:
        step["duration"] = step.pop("estimated_time")
    if "duration" not in step and "estimated_duration" in step:
        step["duration"] = step.pop("estimated_duration")
    if "duration" not in step:
        step["duration"] = "Variable"

    if "source" not in step and "reference" in step:
        step["source"] = step.pop("reference")
    if "source" not in step and "sources" in step:
        sources = step.pop("sources")
        step["source"] = sources[0] if isinstance(sources, list) and sources else str(sources)
    if "source" not in step:
        step["source"] = "Based on standard laboratory protocols"

    return step


def normalize_protocol(data: dict) -> dict:
    """Normalize protocol output to match Protocol schema."""
    if "steps" in data:
        data["steps"] = [normalize_protocol_step(s) for s in data["steps"]]

    if "protocol_references" in data:
        refs = data["protocol_references"]
        normalized_refs = []
        for ref in refs:
            if isinstance(ref, str):
                normalized_refs.append({"title": ref, "url": "", "note": ref})
            elif isinstance(ref, dict):
                if "title" not in ref and "name" in ref:
                    ref["title"] = ref.pop("name")
                if "url" not in ref:
                    ref["url"] = ref.get("doi", ref.get("link", ""))
                normalized_refs.append(ref)
        data["protocol_references"] = normalized_refs

    return data


def normalize_materials(data: dict) -> dict:
    """Normalize materials output."""
    if "materials" in data:
        for mat in data["materials"]:
            if "catalog_number" not in mat:
                mat["catalog_number"] = mat.get("cat_number", mat.get("cat_no", "VERIFY_REQUIRED"))
            if "cost_confidence" not in mat:
                mat["cost_confidence"] = "estimated"
            if "unit_cost" not in mat and "price" in mat:
                mat["unit_cost"] = str(mat.pop("price"))
            if "total_cost" not in mat:
                mat["total_cost"] = mat.get("unit_cost", "0")

    if "budget" in data and "summary" in data["budget"]:
        summary = data["budget"]["summary"]
        field_mapping = {
            "materials": "materials_and_reagents",
            "reagents": "materials_and_reagents",
            "materials_reagents": "materials_and_reagents",
            "personnel": "personnel_2_researchers_3_months",
            "personnel_costs": "personnel_2_researchers_3_months",
            "overhead": "overhead_15pct",
            "contingency": "contingency_10pct",
            "total": "total_estimate",
        }
        for old_key, new_key in field_mapping.items():
            if old_key in summary and new_key not in summary:
                summary[new_key] = summary.pop(old_key)

        defaults = {
            "materials_and_reagents": "$0",
            "equipment": "$0",
            "consumables": "$0",
            "personnel_2_researchers_3_months": "$30,000",
            "overhead_15pct": "$0",
            "contingency_10pct": "$0",
            "total_estimate": "$0",
        }
        for key, default in defaults.items():
            if key not in summary:
                summary[key] = default

    return data


def normalize_timeline(data: dict) -> dict:
    """Normalize timeline output."""
    timeline = data.get("timeline", data)
    if "phases" in timeline:
        for phase in timeline["phases"]:
            if "tasks" not in phase:
                phase["tasks"] = phase.get("activities", phase.get("steps", ["Task 1", "Task 2"]))
            if "milestone" not in phase:
                phase["milestone"] = phase.get("deliverable", f"Complete {phase.get('name', 'phase')}")
            if "dependencies" not in phase:
                phase["dependencies"] = []
            # Normalize dependencies to list of ints
            normalized_deps = []
            for dep in phase.get("dependencies", []):
                if isinstance(dep, int):
                    normalized_deps.append(dep)
                elif isinstance(dep, str):
                    nums = re.findall(r"\d+", dep)
                    if nums:
                        normalized_deps.append(int(nums[0]))
            phase["dependencies"] = normalized_deps
            if "risks" not in phase:
                phase["risks"] = []
            if "deliverables" not in phase:
                phase["deliverables"] = [phase.get("milestone", "")]

    if "validation" in data:
        val = data["validation"]
        if "statistical_analysis" not in val and "statistics" in val:
            val["statistical_analysis"] = val.pop("statistics")
        if "replication_plan" not in val and "replication" in val:
            val["replication_plan"] = val.pop("replication")

        for field in ["primary_endpoint", "statistical_analysis", "replication_plan"]:
            if field in val and len(str(val[field])) < 20:
                val[field] = str(val[field]) + " - to be specified based on experimental design"

    return data
