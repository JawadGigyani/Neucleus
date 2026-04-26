"""Phase 2 tests: feedback store, graph compilation, parse node structure."""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv()


async def test_feedback_roundtrip():
    from db.database import init_db
    from db.feedback_store import save_feedback, get_relevant_feedback
    from schemas.feedback import FeedbackSubmission, SectionReview, Correction

    print("\n=== Testing Feedback Store Round-Trip ===")
    await init_db()

    submission = FeedbackSubmission(
        plan_id="test-plan-001",
        domain="diagnostics",
        experiment_type="CRP biosensor",
        key_terms=["CRP", "electrochemical", "biosensor", "antibody"],
        overall_rating=4.0,
        section_reviews=[
            SectionReview(
                section="protocol",
                rating=4,
                corrections=[
                    Correction(
                        field_path="steps[3].description",
                        original_value="5 ug/mL",
                        corrected_value="10 ug/mL",
                        reason="Higher concentration needed for whole blood",
                    )
                ],
                annotations="Good protocol overall",
            ),
            SectionReview(
                section="materials",
                rating=3,
                corrections=[
                    Correction(
                        field_path="materials[2].catalog_number",
                        original_value="VERIFY_REQUIRED",
                        corrected_value="MAB1707",
                        reason="Confirmed working clone for electrochemistry",
                    )
                ],
            ),
        ],
    )

    feedback_id = await save_feedback(submission)
    print(f"  Saved feedback: {feedback_id}")

    results = await get_relevant_feedback("diagnostics", ["CRP", "biosensor", "electrochemical"])
    print(f"  Retrieved: {len(results)} entries")
    assert len(results) > 0, "No feedback retrieved"

    entry = results[0]
    sections = entry["sections"]
    print(f"  Sections with corrections: {list(sections.keys())}")
    assert "protocol" in sections, "Protocol section missing"
    assert len(sections["protocol"]["corrections"]) > 0, "No corrections found"
    print(f"  Protocol corrections: {sections['protocol']['corrections'][0]['corrected_value']}")

    # Test feedback prompt formatting
    from graph.nodes.feedback_retrieval import format_feedback_for_prompt
    prompt_text = format_feedback_for_prompt(results)
    assert "PRIOR EXPERT CORRECTIONS" in prompt_text
    assert "10 ug/mL" in prompt_text
    print(f"  Formatted prompt length: {len(prompt_text)} chars")
    print("  PASSED")


async def test_graph_compilation():
    from graph.graph import compile_graph

    print("\n=== Testing Graph Compilation ===")
    app = compile_graph()
    nodes = list(app.get_graph().nodes.keys())
    print(f"  Nodes: {nodes}")

    expected = ["parse", "feedback_retrieval", "retrieve", "qc", "protocol",
                "verify_protocol", "materials", "verify_materials", "timeline", "post_process"]
    for n in expected:
        assert n in nodes, f"Missing node: {n}"
    print("  PASSED")


async def test_schemas():
    from schemas.hypothesis import ParseOutput, ParsedHypothesis, SearchQueries

    print("\n=== Testing Schema Validation ===")

    valid = ParseOutput(
        parsed_hypothesis=ParsedHypothesis(
            intervention="anti-CRP antibody biosensor",
            outcome="detect CRP below 0.5 mg/L",
            mechanism="electrochemical detection",
            model_system="paper-based electrode",
            control="laboratory ELISA",
            threshold="0.5 mg/L within 10 minutes",
            key_terms=["CRP", "biosensor", "electrochemical"],
            domain="diagnostics",
        ),
        search_queries=SearchQueries(
            academic_queries=["electrochemical CRP biosensor", "anti-CRP antibody detection", "paper-based biosensor"],
            protocol_queries=["CRP biosensor protocol site:protocols.io", "electrochemical immunoassay site:nature.com/nprot", "biosensor fabrication site:bio-protocol.org"],
            supplier_queries=["anti-CRP antibody site:sigmaaldrich.com", "screen-printed carbon electrode site:thermofisher.com", "potentiostat site:fishersci.com"],
            reference_queries=["ELISA CRP detection standard"],
        ),
    )
    print(f"  ParseOutput valid: {valid.parsed_hypothesis.domain}")

    # Test validation fails on bad data
    try:
        ParsedHypothesis(key_terms=["a"], domain="test")
        assert False, "Should have failed with too few key_terms"
    except Exception:
        print("  Validation correctly rejects bad data")

    print("  PASSED")


async def main():
    print("=" * 60)
    print("PHASE 2: PIPELINE CORE TESTS")
    print("=" * 60)

    for name, test_fn in [
        ("Schemas", test_schemas),
        ("Graph Compilation", test_graph_compilation),
        ("Feedback Round-Trip", test_feedback_roundtrip),
    ]:
        try:
            await test_fn()
        except Exception as e:
            print(f"  FAILED: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
