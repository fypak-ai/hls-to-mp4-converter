import os
import uuid
import asyncio
import subprocess
from pathlib import Path
from typing import Optional

import aiofiles
import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", "./uploads"))
CONVERTED_DIR = Path(os.getenv("CONVERTED_DIR", "./converted"))
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
CONVERTED_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="HLS to MP4 Converter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/converted", StaticFiles(directory=str(CONVERTED_DIR)), name="converted")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

jobs: dict = {}  # in-memory store


class ConvertRequest(BaseModel):
    url: Optional[str] = None
    filename: Optional[str] = None


class JobStatus(BaseModel):
    id: str
    status: str  # pending | converting | done | error
    source: str
    output_file: Optional[str] = None
    output_url: Optional[str] = None
    error: Optional[str] = None
    created_at: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a local .m3u8 or .m3u file."""
    if not file.filename.endswith((".m3u8", ".m3u")):
        raise HTTPException(status_code=400, detail="Only .m3u8 or .m3u files are accepted.")

    dest = UPLOADS_DIR / file.filename
    async with aiofiles.open(dest, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {"filename": file.filename, "path": str(dest)}


@app.post("/convert", response_model=JobStatus)
async def convert(req: ConvertRequest):
    """Start an async conversion job. Provide either url or filename."""
    import datetime

    if not req.url and not req.filename:
        raise HTTPException(status_code=400, detail="Provide url or filename.")

    job_id = str(uuid.uuid4())[:8]
    source = req.url or req.filename
    output_name = f"{job_id}.mp4"
    output_path = CONVERTED_DIR / output_name

    job = {
        "id": job_id,
        "status": "pending",
        "source": source,
        "output_file": output_name,
        "output_url": None,
        "error": None,
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    jobs[job_id] = job

    asyncio.create_task(_run_conversion(job_id, source, output_path))

    return job


async def _run_conversion(job_id: str, source: str, output_path: Path):
    job = jobs[job_id]
    job["status"] = "converting"

    # Resolve input: URL or local file
    if source.startswith("http"):
        input_src = source
    else:
        input_src = str(UPLOADS_DIR / source)

    cmd = [
        "ffmpeg", "-y",
        "-protocol_whitelist", "file,http,https,tcp,tls,crypto",
        "-i", input_src,
        "-c", "copy",
        str(output_path),
    ]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()

        if proc.returncode != 0:
            job["status"] = "error"
            job["error"] = stderr.decode()[-500:]
        else:
            job["status"] = "done"
            job["output_url"] = f"/converted/{output_path.name}"
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)


@app.get("/jobs", response_model=list[JobStatus])
async def list_jobs():
    return list(jobs.values())


@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found.")
    return jobs[job_id]


@app.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found.")
    job = jobs.pop(job_id)
    # remove output file
    if job.get("output_file"):
        f = CONVERTED_DIR / job["output_file"]
        if f.exists():
            f.unlink()
    return {"deleted": job_id}
