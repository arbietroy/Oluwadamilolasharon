# ClipForge — automatic video editor

Give it a long video (podcast, interview, talking-head video, lecture, vlog). It gives you back:

- **Viral shorts** (about 60 s, 9:16): the strongest moments, picked and scored by Claude, with an on-screen hook title.
- **A polished full-length edit** of the whole video.

Both get the full treatment:

| Feature | How it works |
|---|---|
| Finding viral clips | Whisper transcribes with word timings, then Claude reads the transcript and picks self-contained moments with a strong hook and a payoff. Each clip gets a score out of 100 and a reason. |
| Cutting filler and repetition | Removes "um", "uh", stutters ("I I"), repeated phrases ("so what I, so what I"), false starts, and retakes/rambling that Claude flags. Long pauses are tightened. Optional aggressive mode also cuts "you know", "I mean" and "like,". |
| Subtitles | Animated word-by-word captions burned in (bold pop-in style for shorts, karaoke-style lower captions for long-form), plus an `.srt` file. |
| B-roll | Claude marks moments that need stock footage and suggests search terms. Footage comes from your own `broll/` folder or from Pexels (free API key), fading in and out over the speaker. |
| Background music | Picks a track from your `music/` library that matches the mood Claude detects, then loops it, fades it in and out, and lowers it automatically while someone speaks. |
| Transitions | Smooth transitions (slide, zoom, fade…) with a whoosh sound at chapter changes and big jumps. Audio stays perfectly in sync. |
| Animations | Punch-in zooms on key words, alternating zoom on jump cuts so they feel deliberate, an animated hook title, and sliding chapter titles. |
| Vertical reframing | Tracks the speaker's face to crop landscape footage to 9:16, or fits it over a blurred background. |
| Audio polish | High-pass filter, compression, and loudness normalised to -14 LUFS (the level TikTok, Reels and YouTube expect). |

## Setup

1. Install **Python 3.10+** and **FFmpeg** (`brew install ffmpeg`, `sudo apt install ffmpeg`, or https://ffmpeg.org).
2. In this folder:
   ```bash
   python -m venv .venv
   source .venv/bin/activate          # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Add your keys (both optional, but they make the results much better):
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...   # AI clip selection and edit planning (https://console.anthropic.com)
   export PEXELS_API_KEY=...             # automatic stock b-roll (free: https://www.pexels.com/api/)
   ```
   Without a Claude key, a built-in keyword heuristic picks the clips. It works, but the results are much weaker.
4. Add some royalty-free music to `music/` (see `music/README.md`).
5. Optional: install a bold caption font such as **Montserrat** (Google Fonts). Otherwise your system's default sans-serif font is used.

## Use it

### Web app
```bash
python -m clipforge serve
```
Open http://127.0.0.1:8000. Drop in a video, choose your options, and watch the progress. When it finishes, you can preview and download every clip, its subtitles and its edit plan.

### Command line
```bash
# everything: 5 shorts + full edit
python -m clipforge edit my-podcast.mp4

# 8 shorts of ~45 s, no full edit, blurred-background framing
python -m clipforge edit my-podcast.mp4 -n 8 --length 45 --shorts-only --reframe blur

# just see which clips it would pick
python -m clipforge analyze my-podcast.mp4
```
Run `python -m clipforge edit --help` for every option (`--no-music`, `--no-broll`, `--aggressive`, `--whisper large-v3`, `--highlight "#00FF88"`…).

Results go to `output/<video-name>/`:
```
short_01_<title>.mp4   short_01_<title>.srt   short_01_<title>.plan.json
...
long_edit.mp4          long_edit.srt          long_edit.plan.json
transcript.json  analysis.json  manifest.json
```

### Tweak and re-render
Every output has an editable **`.plan.json`**. It lists the kept time ranges, transitions, b-roll (with file paths), zoom moments, hook text, chapters and music track. Edit it and re-render just that video:
```bash
python -m clipforge render output/my-podcast/short_01_xxx.plan.json
```
The transcript and analysis are cached, so re-runs skip straight to rendering. Use `--refresh` to re-run the analysis.

## How it works

```
video ──► Whisper (word timestamps) ──► Claude: clips, chapters, b-roll cues,
                                         emphasis words, retakes, music mood
                                                   │
          filler/stutter/silence detection ◄───────┘
                     │
                     ▼
              edit plan (JSON) ──► FFmpeg pass 1: frame-accurate cuts + transitions
                                   FFmpeg pass 2: reframe, zooms, b-roll, captions,
                                                  music ducking, sfx, loudness
```

| File | Role |
|---|---|
| `clipforge/transcript.py` | faster-whisper transcription (primed to keep disfluencies so they can be cut) |
| `clipforge/analyze.py` | Claude prompt + JSON schema, heuristic fallback, sanity checks |
| `clipforge/cleanup.py` | filler/repetition detection, keep-segments, source→output timeline |
| `clipforge/reframe.py` | OpenCV face tracking for 9:16 crops |
| `clipforge/assets.py` | music mood matching, local + Pexels b-roll |
| `clipforge/captions.py` | animated ASS captions, hook and chapter titles, SRT |
| `clipforge/render.py` | the two FFmpeg passes |
| `clipforge/pipeline.py` | turns the analysis into edit plans and renders them |
| `clipforge/web/` | FastAPI app + single-page UI |

## Tips
- Speed: `--whisper base` transcribes quickly. Use `large-v3` for the most accurate captions (a GPU helps a lot).
- Screen recordings or wide shots with several people: `--reframe blur` keeps everything in frame.
- Rendering a 1-hour video takes a while on a laptop. Try `--shorts-only` first.
