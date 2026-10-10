"""End-to-end orchestration: transcribe → analyse → plan → render."""

from __future__ import annotations

import json
import re
from pathlib import Path

from .analyze import Analysis, ClipIdea, analyze
from .assets import find_broll, find_music
from .cleanup import find_removals, keep_segments
from .config import TRANSITIONS, Settings
from .log import Log
from .media import MediaInfo, output_fps, probe, require_ffmpeg
from .render import EditPlan, render
from .transcript import Transcript, transcribe


def slugify(text: str, max_len: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:max_len].strip("-") or "clip"


class Project:
    def __init__(self, video: Path, out_root: Path, settings: Settings, log: Log | None = None):
        require_ffmpeg()
        self.video = Path(video).resolve()
        self.settings = settings
        self.log = log or Log()
        self.dir = Path(out_root) / slugify(self.video.stem, 60)
        self.work = self.dir / "work"
        self.dir.mkdir(parents=True, exist_ok=True)
        self.work.mkdir(exist_ok=True)
        self.info: MediaInfo = probe(self.video)
        if not self.info.has_audio:
            raise ValueError("The video has no audio track – ClipForge edits from the speech.")
        self.fps = output_fps(self.info.fps)
        self._transcript: Transcript | None = None
        self._analysis: Analysis | None = None
        self._drop: set[int] | None = None
        self._used_broll: set[str] = set()

    # ---------------------------------------------------------------- steps

    @property
    def transcript_path(self) -> Path:
        return self.dir / "transcript.json"

    def transcript(self, import_from: Path | None = None) -> Transcript:
        if self._transcript:
            return self._transcript
        if import_from:
            tr = Transcript.load(import_from)
            tr.save(self.transcript_path)
        elif self.transcript_path.exists():
            self.log.info("Using cached transcript")
            tr = Transcript.load(self.transcript_path)
        else:
            self.log.info("Transcribing speech (word-level timestamps)…")
            tr = transcribe(self.video, self.settings.whisper_model, self.settings.language, self.log)
            tr.save(self.transcript_path)
        tr.duration = tr.duration or self.info.duration
        self.log.info(f"Transcript: {len(tr.words)} words, {tr.duration:.0f}s")
        self._transcript = tr
        return tr

    def analysis(self, refresh: bool = False) -> Analysis:
        if self._analysis and not refresh:
            return self._analysis
        path = self.dir / "analysis.json"
        if path.exists() and not refresh:
            self.log.info("Using cached analysis")
            a = Analysis.from_dict(json.loads(path.read_text()))
        else:
            a = analyze(self.transcript(), self.settings, self.log)
            path.write_text(json.dumps(a.to_dict(), indent=2))
        self.log.info(f"Analysis ({a.source}): {len(a.clips)} clips, {len(a.chapters)} chapters, "
                      f"{len(a.broll)} b-roll cues, music mood '{a.music_mood}'")
        self._analysis = a
        return a

    def _removals(self) -> set[int]:
        if self._drop is None:
            s = self.settings
            self._drop = find_removals(self.transcript().words, s.remove_fillers, s.remove_repetition,
                                       s.aggressive_fillers)
            self.log.info(f"Found {len(self._drop)} filler / repeated words to cut")
        return self._drop

    def _segments(self, start: float, end: float) -> list[list[float]]:
        s = self.settings
        cuts = [(r["start"], r["end"]) for r in self.analysis().remove]
        segs = keep_segments(self.transcript().words, start, end, self._removals(), cuts,
                             s.max_pause, s.pause_padding)
        return [list(x) for x in segs]

    def _broll(self, start: float, end: float, orientation: str, skip_first: float) -> list[dict]:
        s = self.settings
        if not s.broll:
            return []
        cues = [b for b in self.analysis().broll if b.start >= start + skip_first and b.end <= end]
        max_n = max(1, int((end - start) / 60 * s.max_broll_per_minute))
        out, last_end = [], -1e9
        for b in cues:
            if len(out) >= max_n or b.start - last_end < 6:
                continue
            f = find_broll(b.query, s.broll_dir, self.dir.parent / "_broll_cache", orientation,
                           s.pexels_api_key, b.end - b.start, self._used_broll, self.log)
            if f:
                self._used_broll.add(str(f))
                out.append({"start": b.start, "end": b.end, "query": b.query, "file": str(Path(f).resolve())})
                last_end = b.end
        return out

    def _music(self, mood: str, key: str, volume: float) -> dict | None:
        if not self.settings.music:
            return None
        f = find_music(mood, self.settings.music_dir, key)
        if not f:
            self.log.warn(f"No music found in '{self.settings.music_dir}' – add tracks to enable background music")
            return None
        return {"file": str(f.resolve()), "volume": volume, "mood": mood}

    def _base(self, name: str, kind: str, segments, width: int, height: int) -> EditPlan:
        s = self.settings
        return EditPlan(
            name=name, kind=kind, source=str(self.video), segments=segments, width=width, height=height,
            fps=self.fps, captions=s.captions, caption_font=s.caption_font, caption_highlight=s.caption_highlight,
            words_per_line=s.caption_words_per_line_short, zoom_on_jump_cuts=s.zoom_on_jump_cuts,
            transition_sfx=s.transition_sfx, crf=s.crf, preset=s.preset, loudness_lufs=s.loudness_lufs,
            meta={"transcript": str(self.transcript_path.resolve())},
        )

    # ---------------------------------------------------------------- plans

    def plan_short(self, clip: ClipIdea, index: int) -> EditPlan:
        s = self.settings
        segs = self._segments(clip.start, clip.end)
        styles = [t for t in ("smoothleft", "zoomin", "slideup", "fadewhite") if t in TRANSITIONS]
        transitions = []
        if s.transitions:
            for i in range(len(segs) - 1):
                if segs[i + 1][0] - segs[i][1] >= s.transition_min_gap:
                    transitions.append({"after": i, "type": styles[len(transitions) % len(styles)],
                                        "duration": min(s.transition_duration, 0.35)})
        w, h = s.short_size
        plan = self._base(f"short_{index:02d}_{slugify(clip.title)}", "short", segs, w, h)
        plan.transitions = transitions
        plan.reframe = s.reframe
        plan.hook_text = clip.hook_text if s.hook_title else None
        plan.emphasis = [t for t in self.analysis().emphasis if clip.start <= t <= clip.end] if s.emphasis_zoom else []
        plan.broll = self._broll(clip.start, clip.end, "portrait", skip_first=4.0)
        plan.music = self._music(clip.music_mood, plan.name, s.music_volume)
        plan.meta.update({"title": clip.title, "virality_score": clip.virality_score, "reason": clip.reason,
                          "source_range": [clip.start, clip.end]})
        return plan

    def plan_long(self) -> EditPlan:
        s = self.settings
        tr, a = self.transcript(), self.analysis()
        segs = self._segments(0.0, tr.duration)
        chapters = [c for c in a.chapters if c["start"] > 5]
        transitions = []
        if s.transitions:
            for c in chapters:
                i = _split_for_transition(segs, c["start"])
                if i is not None:
                    transitions.append({"after": i, "type": a.transition_style, "duration": s.transition_duration})
            transitions = _dedupe(segs, transitions)
        if self.info.is_vertical:
            w = min(self.info.width, 1080)
            h = int(w * self.info.height / self.info.width)
        else:
            h = min(self.info.height, s.long_max_height)
            w = int(h * self.info.width / self.info.height)
        plan = self._base("long_edit", "long", segs, w // 2 * 2, h // 2 * 2)
        plan.transitions = transitions
        plan.chapters = [{"time": c["start"], "title": c["title"]} for c in a.chapters] if s.chapter_titles else []
        plan.emphasis = a.emphasis if s.emphasis_zoom else []
        plan.zoom_on_jump_cuts = s.zoom_on_jump_cuts and len(segs) <= 400
        plan.broll = self._broll(0.0, tr.duration, "portrait" if self.info.is_vertical else "landscape", skip_first=5.0)
        plan.music = self._music(a.music_mood, "long", s.music_volume * 0.6)
        plan.meta.update({"title": "Full edit", "summary": a.summary})
        return plan

    # ---------------------------------------------------------------- run

    def run(self, shorts: bool = True, long: bool = True, only_clip: int | None = None) -> list[dict]:
        tr = self.transcript()
        a = self.analysis()
        plans: list[EditPlan] = []
        if shorts:
            for i, clip in enumerate(a.clips, 1):
                if only_clip is None or only_clip == i:
                    plans.append(self.plan_short(clip, i))
        if long:
            plans.append(self.plan_long())

        results = []
        for k, plan in enumerate(plans, 1):
            plan_path = self.dir / f"{plan.name}.plan.json"
            plan.save(plan_path)
            self.log.info(f"[{k}/{len(plans)}] Rendering {plan.name}")
            try:
                out = render(plan, tr, self.dir, self.work / plan.name, self.log)
            except Exception as e:
                self.log.warn(f"{plan.name} failed: {e}")
                results.append({"name": plan.name, "error": str(e), "plan": str(plan_path)})
                continue
            info = probe(out)
            results.append({
                "name": plan.name, "kind": plan.kind, "file": str(out), "srt": str(self.dir / f"{plan.name}.srt"),
                "plan": str(plan_path), "duration": round(info.duration, 2),
                **{k: v for k, v in plan.meta.items() if k != "transcript"},
                "hook_text": plan.hook_text, "music": plan.music and Path(plan.music["file"]).name,
                "broll": [b["query"] for b in plan.broll], "cuts": len(plan.segments) - 1,
            })
        (self.dir / "manifest.json").write_text(json.dumps(results, indent=2))
        return results


def _split_for_transition(segs: list[list[float]], t: float, window: float = 4.0) -> int | None:
    """Index of the segment boundary to put a transition on, splitting a segment if needed."""
    best, best_d = None, window
    for i in range(len(segs) - 1):
        d = abs(segs[i][1] - t)
        if d < best_d:
            best, best_d = i, d
    if best is not None:
        return best
    for i, (a, b) in enumerate(segs):
        if a + 1.0 < t < b - 1.0:
            segs[i:i + 1] = [[a, t], [t, b]]
            return i
    return None


def _dedupe(segs: list[list[float]], transitions: list[dict]) -> list[dict]:
    # Chapters are processed in time order, so a split never shifts an earlier transition's index.
    seen, out = set(), []
    for t in transitions:
        i = min(t["after"], len(segs) - 2)
        if i >= 0 and i not in seen:
            seen.add(i)
            out.append({**t, "after": i})
    return out


def render_plan_file(plan_path: Path, out_dir: Path | None = None, log: Log | None = None) -> Path:
    """Re-render a (possibly hand-edited) plan JSON."""
    log = log or Log()
    plan = EditPlan.load(plan_path)
    tr = Transcript.load(Path(plan.meta["transcript"]))
    out_dir = out_dir or Path(plan_path).parent
    return render(plan, tr, out_dir, out_dir / "work" / plan.name, log)
