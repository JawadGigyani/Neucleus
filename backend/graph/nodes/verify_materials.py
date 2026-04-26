"""Verify materials node: checks catalog numbers via Tavily search."""

import re
import time
import asyncio
from graph.state import AgentState
from lib.tavily_client import search_tavily
from schemas.materials import Material

CATALOG_LABEL_RE = re.compile(
    r'(?:Cat(?:alog)?[\s.]*(?:No|#|Number)?[\s.:]*)\s*([A-Z0-9][A-Z0-9.\-/]{4,20})',
    re.IGNORECASE,
)
PRODUCT_CODE_RE = re.compile(
    r'\b([A-Z]{1,5}[-]?\d{2,}[-A-Z0-9.]*)\b',
    re.IGNORECASE,
)
FALSE_POSITIVES = frozenset({
    "ions", "egories", "alog", "number", "verify", "required", "catalog",
    "category", "categories", "ategories", "atalog", "umber", "ection",
    "section", "ptions", "options", "ation", "ations",
})


def extract_catalog_number(text: str) -> str | None:
    for pattern in [CATALOG_LABEL_RE, PRODUCT_CODE_RE]:
        for m in pattern.finditer(text):
            candidate = m.group(1).strip().rstrip(".")
            if candidate.lower() in FALSE_POSITIVES:
                continue
            if not any(c.isdigit() for c in candidate):
                continue
            if len(candidate) < 4:
                continue
            return candidate
    return None


async def _search_catalog_number(material: Material) -> Material:
    """Attempt to find a real catalog number for VERIFY_REQUIRED items."""
    query = f"{material.name} {material.supplier} catalog number product page"
    results = await search_tavily(query, max_results=3)

    if not results:
        return material

    for r in results:
        text = f"{r.title} {r.snippet}"
        cat_num = extract_catalog_number(text)
        if cat_num:
            material.catalog_number = cat_num
            material.verification_status = "CORRECTED"
            material.verification_url = r.url
            return material

    name_lower = material.name.lower()
    for r in results:
        if name_lower in f"{r.title} {r.snippet}".lower():
            material.verification_status = "PARTIALLY_VERIFIED"
            material.verification_url = r.url
            return material

    return material


async def verify_single_material(material: Material) -> Material:
    if material.catalog_number == "VERIFY_REQUIRED":
        return await _search_catalog_number(material)

    query = f"{material.supplier} {material.catalog_number} {material.name}"
    results = await search_tavily(query, max_results=3)

    if not results:
        material.verification_status = "UNVERIFIED"
        return material

    cat_lower = material.catalog_number.lower()
    name_lower = material.name.lower()

    for r in results:
        text = f"{r.title} {r.snippet}".lower()
        if cat_lower in text:
            material.verification_status = "VERIFIED"
            material.verification_url = r.url
            return material
        if name_lower in text and material.supplier.lower() in text:
            material.verification_status = "PARTIALLY_VERIFIED"
            material.verification_url = r.url
            return material

    material.verification_status = "UNVERIFIED"
    return material


async def verify_materials_node(state: AgentState) -> dict:
    start = time.time()
    materials = state.get("materials", [])

    if not materials:
        return {
            "current_stage": "verify_materials_complete",
            "stage_durations": {**state.get("stage_durations", {}), "verify_materials": time.time() - start},
        }

    to_verify = materials[:20]

    try:
        verified = await asyncio.gather(
            *[verify_single_material(m) for m in to_verify],
            return_exceptions=True,
        )
    except Exception as e:
        print(f"[VerifyMaterials] Batch error: {e}")
        verified = to_verify

    final_materials = []
    for result in verified:
        if isinstance(result, Exception):
            print(f"[VerifyMaterials] Single verify error: {result}")
            continue
        final_materials.append(result)
    remaining = materials[20:]
    final_materials.extend(remaining)

    verified_count = sum(1 for m in final_materials if m.verification_status == "VERIFIED")
    corrected_count = sum(1 for m in final_materials if m.verification_status == "CORRECTED")
    partial_count = sum(1 for m in final_materials if m.verification_status == "PARTIALLY_VERIFIED")
    duration = time.time() - start
    print(f"[VerifyMaterials] {verified_count} verified, {corrected_count} corrected, {partial_count} partial, {len(final_materials)} total in {duration:.1f}s")

    return {
        "materials": final_materials,
        "current_stage": "verify_materials_complete",
        "stage_durations": {**state.get("stage_durations", {}), "verify_materials": duration},
    }
