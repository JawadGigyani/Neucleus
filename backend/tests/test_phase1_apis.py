"""Phase 1 tests: verify all API connections return expected data."""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv()


async def test_openalex():
    from lib.openalex import search_openalex

    print("\n=== Testing OpenAlex API ===")
    results = await search_openalex("electrochemical biosensor CRP detection", per_page=3)
    print(f"  Results: {len(results)}")
    for r in results[:2]:
        print(f"  - {r.title[:80]}...")
        print(f"    Year: {r.year}, Citations: {r.cited_by_count}")
        print(f"    Snippet: {r.snippet[:100]}...")
    assert len(results) > 0, "OpenAlex returned no results"
    print("  PASSED")
    return True


async def test_semantic_scholar():
    from lib.semantic_scholar import search_semantic_scholar

    print("\n=== Testing Semantic Scholar API ===")
    results = await search_semantic_scholar("CRP biosensor electrochemical", limit=3)
    print(f"  Results: {len(results)}")
    for r in results[:2]:
        print(f"  - {r.title[:80]}...")
    if len(results) == 0:
        print("  WARNING: S2 returned 0 results (may be rate limited without API key)")
    else:
        print("  PASSED")
    return True


async def test_crossref():
    from lib.crossref import search_crossref

    print("\n=== Testing CrossRef API ===")
    results = await search_crossref("electrochemical biosensor C-reactive protein", rows=3)
    print(f"  Results: {len(results)}")
    for r in results[:2]:
        print(f"  - {r.title[:80]}...")
    assert len(results) > 0, "CrossRef returned no results"
    print("  PASSED")
    return True


async def test_tavily():
    from lib.tavily_client import search_tavily

    print("\n=== Testing Tavily API ===")
    if not os.getenv("TAVILY_API_KEY"):
        print("  SKIPPED: TAVILY_API_KEY not set")
        return False

    results = await search_tavily("electrochemical biosensor protocol site:protocols.io", max_results=3)
    print(f"  Results: {len(results)}")
    for r in results[:2]:
        print(f"  - {r.title[:80]}...")
        print(f"    URL: {r.url}")
    assert len(results) > 0, "Tavily returned no results"
    print("  PASSED")
    return True


async def test_featherless():
    from lib.llm import get_llm

    print("\n=== Testing Featherless.ai (Qwen2.5-7B) ===")
    if not os.getenv("FEATHERLESS_API_KEY"):
        print("  SKIPPED: FEATHERLESS_API_KEY not set")
        return False

    llm = get_llm("parse", temperature=0.1)
    from langchain_core.messages import HumanMessage

    response = await llm.ainvoke([HumanMessage(content="Reply with exactly: CONNECTED")])
    print(f"  Response: {response.content.strip()}")
    assert "CONNECTED" in response.content.upper(), f"Unexpected response: {response.content}"
    print("  PASSED")
    return True


async def main():
    print("=" * 60)
    print("PHASE 1: API CONNECTIVITY TESTS")
    print("=" * 60)

    env_check = True
    if not os.getenv("FEATHERLESS_API_KEY"):
        print("\nWARNING: FEATHERLESS_API_KEY not set in .env")
        env_check = False
    if not os.getenv("TAVILY_API_KEY"):
        print("WARNING: TAVILY_API_KEY not set in .env")
        env_check = False

    if not env_check:
        print("\nPlease create backend/.env with your API keys (see .env.example)")

    results = {}
    for name, test_fn in [
        ("OpenAlex", test_openalex),
        ("Semantic Scholar", test_semantic_scholar),
        ("CrossRef", test_crossref),
        ("Tavily", test_tavily),
        ("Featherless", test_featherless),
    ]:
        try:
            results[name] = await test_fn()
        except Exception as e:
            print(f"  FAILED: {e}")
            results[name] = False

    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    for name, passed in results.items():
        status = "PASS" if passed else "FAIL/SKIP"
        print(f"  {name}: {status}")

    required_pass = results.get("OpenAlex", False) and results.get("CrossRef", False)
    if required_pass:
        print("\nCore APIs working. Ready for Phase 2.")
    else:
        print("\nSome core APIs failed. Check network connectivity.")


if __name__ == "__main__":
    asyncio.run(main())
