"""CRUD operations for the feedback store."""

import json
import uuid
from datetime import datetime
from db.database import get_db
from schemas.feedback import FeedbackSubmission, StoredFeedback, SectionReview, Correction


async def save_feedback(submission: FeedbackSubmission) -> str:
    session_id = str(uuid.uuid4())
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO feedback_sessions (id, plan_id, domain, experiment_type, key_terms, overall_rating) VALUES (?, ?, ?, ?, ?, ?)",
            (session_id, submission.plan_id, submission.domain, submission.experiment_type,
             json.dumps(submission.key_terms), submission.overall_rating),
        )

        for review in submission.section_reviews:
            review_id = str(uuid.uuid4())
            corrections_json = json.dumps([c.model_dump() for c in review.corrections])
            await db.execute(
                "INSERT INTO section_reviews (id, session_id, section, rating, corrections, annotations) VALUES (?, ?, ?, ?, ?, ?)",
                (review_id, session_id, review.section, review.rating, corrections_json, review.annotations or ""),
            )

        await db.commit()
        return session_id
    finally:
        await db.close()


async def get_feedback_for_domain(domain: str, limit: int = 5) -> list[StoredFeedback]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM feedback_sessions WHERE domain = ? ORDER BY created_at DESC LIMIT ?",
            (domain, limit),
        )
        sessions = await cursor.fetchall()

        results = []
        for session in sessions:
            review_cursor = await db.execute(
                "SELECT * FROM section_reviews WHERE session_id = ?",
                (session["id"],),
            )
            review_rows = await review_cursor.fetchall()

            section_reviews = []
            for row in review_rows:
                corrections_data = json.loads(row["corrections"])
                corrections = [Correction(**c) for c in corrections_data]
                section_reviews.append(SectionReview(
                    section=row["section"],
                    rating=row["rating"],
                    corrections=corrections,
                    annotations=row["annotations"] if row["annotations"] else None,
                ))

            results.append(StoredFeedback(
                id=session["id"],
                plan_id=session["plan_id"],
                domain=session["domain"],
                experiment_type=session["experiment_type"],
                key_terms=json.loads(session["key_terms"]),
                overall_rating=session["overall_rating"],
                section_reviews=section_reviews,
                created_at=datetime.fromisoformat(session["created_at"]),
            ))

        return results
    finally:
        await db.close()


async def get_relevant_feedback(domain: str, key_terms: list[str], limit: int = 3) -> list[dict]:
    """Retrieve feedback entries most relevant to the given domain and key terms.
    Returns formatted dicts ready for prompt injection."""
    all_feedback = await get_feedback_for_domain(domain, limit=10)

    if not all_feedback:
        return []

    scored: list[tuple[float, StoredFeedback]] = []
    for fb in all_feedback:
        fb_terms = set(t.lower() for t in fb.key_terms)
        query_terms = set(t.lower() for t in key_terms)
        overlap = len(fb_terms & query_terms)
        union = len(fb_terms | query_terms)
        jaccard = overlap / union if union > 0 else 0.0
        scored.append((jaccard, fb))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:limit]

    results = []
    for score, fb in top:
        if score == 0 and not any(r.corrections for r in fb.section_reviews):
            continue

        entry = {
            "feedback_id": fb.id,
            "domain": fb.domain,
            "experiment_type": fb.experiment_type,
            "overall_rating": fb.overall_rating,
            "relevance_score": score,
            "sections": {},
        }

        for review in fb.section_reviews:
            if review.corrections or review.annotations:
                entry["sections"][review.section] = {
                    "rating": review.rating,
                    "corrections": [c.model_dump() for c in review.corrections],
                    "annotations": review.annotations,
                }

        if entry["sections"]:
            results.append(entry)

    return results
