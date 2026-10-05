"""Command line interface: python -m clipforge --help"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .config import Settings
from .log import Log


def _settings(args) -> Settings:
    s = Settings()
    s.num_clips = args.clips
    s.clip_target_seconds = args.length
    s.clip_min_seconds = max(15.0, args.length * 0.75)
    s.clip_max_seconds = args.length * 1.25
    s.whisper_model = args.whisper
    s.language = args.language
    s.use_claude = not args.no_ai
    s.captions = not args.no_captions
    s.music = not args.no_music
    s.broll = not args.no_broll
    s.transitions = not args.no_transitions
    s.transition_sfx = not args.no_transitions
    s.remove_fillers = not args.keep_fillers
    s.remove_repetition = not args.keep_fillers
    s.aggressive_fillers = args.aggressive
    s.reframe = args.reframe
    s.music_dir = Path(args.music_dir)
    s.broll_dir = Path(args.broll_dir)
    s.caption_font = args.font
    s.caption_highlight = args.highlight
    s.zoom_on_jump_cuts = s.emphasis_zoom = not args.no_zoom
    return s


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="clipforge", description="Automatic video editor: viral shorts + polished long-form.")
    sub = p.add_subparsers(dest="cmd", required=True)

    def common(sp):
        sp.add_argument("video", type=Path)
        sp.add_argument("-o", "--out", type=Path, default=Path("output"))
        sp.add_argument("-n", "--clips", type=int, default=5, help="number of shorts to cut (default 5)")
        sp.add_argument("--length", type=float, default=60, help="target short length in seconds (default 60)")
        sp.add_argument("--whisper", default="small", help="whisper model: tiny/base/small/medium/large-v3")
        sp.add_argument("--language", default=None, help="spoken language code, e.g. en (default: auto)")
        sp.add_argument("--transcript", type=Path, help="use an existing transcript JSON instead of Whisper")
        sp.add_argument("--no-ai", action="store_true", help="don't call Claude; use the heuristic planner")
        sp.add_argument("--refresh", action="store_true", help="re-run the analysis even if cached")
        sp.add_argument("--no-captions", action="store_true")
        sp.add_argument("--no-music", action="store_true")
        sp.add_argument("--no-broll", action="store_true")
        sp.add_argument("--no-transitions", action="store_true")
        sp.add_argument("--no-zoom", action="store_true", help="disable punch-in zoom animations")
        sp.add_argument("--keep-fillers", action="store_true", help="don't cut ums/uhs and repeated words")
        sp.add_argument("--aggressive", action="store_true", help='also cut "you know", "I mean", "like,"')
        sp.add_argument("--reframe", choices=["face", "blur", "center"], default="face",
                        help="how to turn landscape footage vertical for shorts")
        sp.add_argument("--music-dir", default="music")
        sp.add_argument("--broll-dir", default="broll")
        sp.add_argument("--font", default="Montserrat")
        sp.add_argument("--highlight", default="#FFE600", help="caption highlight colour")
        sp.add_argument("-v", "--verbose", action="store_true")

    e = sub.add_parser("edit", help="transcribe, find clips and render everything")
    common(e)
    e.add_argument("--shorts-only", action="store_true")
    e.add_argument("--long-only", action="store_true")
    e.add_argument("--clip", type=int, help="render only this clip number")

    a = sub.add_parser("analyze", help="transcribe and plan, without rendering")
    common(a)

    r = sub.add_parser("render", help="re-render a .plan.json (edit it by hand first if you like)")
    r.add_argument("plan", type=Path)
    r.add_argument("-v", "--verbose", action="store_true")

    sv = sub.add_parser("serve", help="start the web app")
    sv.add_argument("--host", default="127.0.0.1")
    sv.add_argument("--port", type=int, default=8000)

    args = p.parse_args(argv)

    if args.cmd == "serve":
        import uvicorn
        uvicorn.run("clipforge.web.app:app", host=args.host, port=args.port)
        return 0

    log = Log(verbose=getattr(args, "verbose", False))
    if args.cmd == "render":
        from .pipeline import render_plan_file
        out = render_plan_file(args.plan, log=log)
        print(out)
        return 0

    from .pipeline import Project
    project = Project(args.video, args.out, _settings(args), log)
    project.transcript(args.transcript)
    analysis = project.analysis(refresh=args.refresh)

    if args.cmd == "analyze":
        for i, c in enumerate(analysis.clips, 1):
            print(f"\n#{i}  [{c.start:7.1f}s – {c.end:7.1f}s]  score {c.virality_score}  {c.title}")
            print(f"     hook: {c.hook_text}\n     why:  {c.reason}\n     music: {c.music_mood}")
        print(f"\nChapters: " + ", ".join(f"{c['start']:.0f}s {c['title']}" for c in analysis.chapters))
        print(f"Analysis saved to {project.dir / 'analysis.json'}")
        return 0

    results = project.run(shorts=not args.long_only, long=not args.shorts_only, only_clip=args.clip)
    print(json.dumps([{k: r.get(k) for k in ("name", "file", "duration", "virality_score", "error")} for r in results], indent=2))
    return 0 if all("error" not in r for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
