"""Web app: upload a video, pick options, watch progress, preview and download the edits.

Run with:  python -m clipforge serve
"""

from __future__ import annotations

import queue
import threading
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse

from ..config import Settings
from ..log import Log

ROOT = Path.cwd()
UPLOADS = ROOT / "uploads"
OUTPUT = ROOT / "output"
INDEX = Path(__file__).with_name("index.html")

app = FastAPI(title="ClipForge")
jobs: dict[str, dict] = {}
work_queue: "queue.Queue[str]" = queue.Queue()


def _worker() -> None:
    from ..pipeline import Project

    while True:
        job_id = work_queue.get()
        job = jobs[job_id]
        job["status"] = "running"

        def sink(line: str, pct: float | None) -> None:
            if pct is None:
                job["log"].append(line)
            else:
                job["step"] = line
                job["progress"] = pct

        try:
            project = Project(Path(job["video"]), OUTPUT, job["settings"], Log(sink))
            job["dir"] = str(project.dir)
            project.transcript()
            project.analysis()
            mode = job["mode"]
            job["outputs"] = project.run(shorts=mode in ("both", "shorts"), long=mode in ("both", "long"))
            job["status"] = "done"
        except Exception as e:  # surface every failure to the UI
            job["status"] = "error"
            job["error"] = str(e)
        job["finished"] = time.time()


threading.Thread(target=_worker, daemon=True).start()


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return INDEX.read_text()


@app.post("/api/jobs")
async def create_job(
    video: UploadFile = File(...),
    mode: str = Form("both"),
    clips: int = Form(5),
    length: float = Form(60),
    captions: bool = Form(True),
    music: bool = Form(True),
    broll: bool = Form(True),
    transitions: bool = Form(True),
    zoom: bool = Form(True),
    fillers: bool = Form(True),
    aggressive: bool = Form(False),
    reframe: str = Form("face"),
    highlight: str = Form("#FFE600"),
    whisper: str = Form("small"),
) -> dict:
    job_id = uuid.uuid4().hex[:10]
    dest_dir = UPLOADS / job_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    name = Path(video.filename or "video.mp4").name
    dest = dest_dir / name
    with open(dest, "wb") as fh:
        while chunk := await video.read(1 << 20):
            fh.write(chunk)

    s = Settings()
    s.num_clips = max(1, min(clips, 20))
    s.clip_target_seconds = length
    s.clip_min_seconds = max(15.0, length * 0.75)
    s.clip_max_seconds = length * 1.25
    s.captions, s.music, s.broll, s.transitions = captions, music, broll, transitions
    s.transition_sfx = transitions
    s.zoom_on_jump_cuts = s.emphasis_zoom = zoom
    s.remove_fillers = s.remove_repetition = fillers
    s.aggressive_fillers = aggressive
    s.reframe = reframe if reframe in ("face", "blur", "center") else "face"
    s.caption_highlight = highlight
    s.whisper_model = whisper
    s.music_dir = ROOT / "music"
    s.broll_dir = ROOT / "broll"

    jobs[job_id] = {
        "id": job_id, "video": str(dest), "name": name, "mode": mode, "settings": s, "status": "queued",
        "progress": 0.0, "step": "", "log": [], "outputs": [], "error": None, "created": time.time(),
    }
    work_queue.put(job_id)
    return {"id": job_id}


def _public(job: dict) -> dict:
    outputs = []
    for o in job["outputs"]:
        o = dict(o)
        for key in ("file", "srt", "plan"):
            if o.get(key):
                o[key] = f"/media/{job['id']}/{Path(o[key]).name}"
        outputs.append(o)
    return {k: v for k, v in job.items() if k not in ("settings", "video", "dir")} | {"outputs": outputs}


@app.get("/api/jobs")
def list_jobs() -> list[dict]:
    return [_public(j) for j in sorted(jobs.values(), key=lambda j: -j["created"])]


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str) -> dict:
    if job_id not in jobs:
        raise HTTPException(404)
    return _public(jobs[job_id])


@app.get("/media/{job_id}/{filename}")
def media(job_id: str, filename: str) -> FileResponse:
    job = jobs.get(job_id)
    if not job or not job.get("dir"):
        raise HTTPException(404)
    base = Path(job["dir"]).resolve()
    path = (base / filename).resolve()
    if path.parent != base or not path.is_file():
        raise HTTPException(404)
    return FileResponse(path, filename=filename if path.suffix != ".mp4" else None)
