"""FastAPI application — REST API + SSE streaming for the AI Scientist pipeline."""

import asyncio
import uuid
import time
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

from graph.graph import compile_graph
from db.database import init_db
from db.feedback_store import save_feedback, get_feedback_for_domain
from schemas.feedback import FeedbackSubmission

# In-memory job store
jobs: dict[str, dict] = {}
job_queues: dict[str, asyncio.Queue] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Neucleus", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = compile_graph()


class GenerateRequest(BaseModel):
    hypothesis: str


class GenerateResponse(BaseModel):
    job_id: str


STAGE_DESCRIPTIONS = {
    "parse": "Parsing hypothesis and generating search queries...",
    "feedback_retrieval": "Checking for prior expert feedback...",
    "retrieve": "Searching 15+ scientific sources in parallel...",
    "qc": "Analyzing literature and classifying novelty...",
    "protocol": "Generating detailed experiment protocol...",
    "verify_protocol": "Verifying protocol steps against sources...",
    "materials": "Generating materials list and budget...",
    "verify_materials": "Verifying catalog numbers with suppliers...",
    "timeline": "Creating phased timeline and validation criteria...",
    "post_process": "Finalizing experiment plan...",
}

STAGE_ORDER = [
    "parse", "feedback_retrieval", "retrieve", "qc", "protocol",
    "verify_protocol", "materials", "verify_materials", "timeline", "post_process",
]


async def run_pipeline(job_id: str, hypothesis: str):
    queue = job_queues[job_id]

    try:
        await queue.put({
            "stage": "starting",
            "status": "in_progress",
            "message": "Pipeline starting...",
            "timestamp": time.time(),
        })

        current_stage_idx = -1

        async for event in graph.astream(
            {"hypothesis": hypothesis, "errors": [], "stage_durations": {}},
            stream_mode="updates",
        ):
            for node_name, node_output in event.items():
                stage = node_output.get("current_stage", node_name)
                base_stage = node_name

                stage_idx = STAGE_ORDER.index(base_stage) if base_stage in STAGE_ORDER else -1
                if stage_idx > current_stage_idx:
                    current_stage_idx = stage_idx
                    await queue.put({
                        "stage": base_stage,
                        "status": "in_progress",
                        "message": STAGE_DESCRIPTIONS.get(base_stage, f"Running {base_stage}..."),
                        "timestamp": time.time(),
                        "stage_index": stage_idx,
                        "total_stages": len(STAGE_ORDER),
                    })

                if "final_plan" in node_output:
                    jobs[job_id]["result"] = node_output["final_plan"].model_dump()
                    jobs[job_id]["status"] = "completed"

                # Forward errors
                if node_output.get("errors"):
                    jobs[job_id].setdefault("errors", []).extend(node_output["errors"])

        await queue.put({
            "stage": "complete",
            "status": "completed",
            "message": "Experiment plan generated successfully!",
            "timestamp": time.time(),
        })

    except Exception as e:
        print(f"[Pipeline] Fatal error: {e}")
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)
        await queue.put({
            "stage": "error",
            "status": "error",
            "message": f"Pipeline error: {str(e)}",
            "timestamp": time.time(),
        })

    finally:
        await queue.put(None)


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_plan(request: GenerateRequest):
    if not request.hypothesis.strip():
        raise HTTPException(status_code=400, detail="Hypothesis cannot be empty")

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "running",
        "hypothesis": request.hypothesis,
        "started_at": time.time(),
    }
    job_queues[job_id] = asyncio.Queue()

    asyncio.create_task(run_pipeline(job_id, request.hypothesis))

    return GenerateResponse(job_id=job_id)


@app.get("/api/stream/{job_id}")
async def stream_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    queue = job_queues.get(job_id)
    if not queue:
        raise HTTPException(status_code=404, detail="Job stream not found")

    async def event_generator():
        while True:
            event = await queue.get()
            if event is None:
                break
            yield {
                "event": "progress",
                "data": str(event).replace("'", '"'),
            }

    return EventSourceResponse(event_generator())


@app.get("/api/result/{job_id}")
async def get_result(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job["status"] == "running":
        raise HTTPException(status_code=202, detail="Job still running")

    if job["status"] == "error":
        raise HTTPException(status_code=500, detail=job.get("error", "Unknown error"))

    result = job.get("result")
    if not result:
        raise HTTPException(status_code=500, detail="No result available")

    return result


@app.post("/api/feedback")
async def submit_feedback(submission: FeedbackSubmission):
    session_id = await save_feedback(submission)
    return {"status": "ok", "feedback_id": session_id}


@app.get("/api/feedback/{domain}")
async def get_domain_feedback(domain: str):
    feedback = await get_feedback_for_domain(domain, limit=10)
    return {"domain": domain, "count": len(feedback), "feedback": [f.model_dump() for f in feedback]}


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "featherless_key_set": bool(os.getenv("FEATHERLESS_API_KEY")),
        "tavily_key_set": bool(os.getenv("TAVILY_API_KEY")),
        "s2_key_set": bool(os.getenv("S2_API_KEY")),
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
