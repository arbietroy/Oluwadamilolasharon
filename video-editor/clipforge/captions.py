"""Animated subtitles (ASS) plus a plain SRT export."""

from __future__ import annotations

from pathlib import Path

from .transcript import Word


def ass_time(t: float) -> str:
    t = max(0.0, t)
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def srt_time(t: float) -> str:
    ms = int(round(max(0.0, t) * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def ass_color(hex_rgb: str, alpha: int = 0) -> str:
    h = hex_rgb.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alpha:02X}{b}{g}{r}".upper()


def _esc(text: str) -> str:
    return text.replace("\\", "").replace("{", "(").replace("}", ")").replace("\n", " ")


def group_words(words: list[Word], max_words: int, max_chars: int, max_gap: float = 0.5) -> list[list[Word]]:
    groups: list[list[Word]] = []
    cur: list[Word] = []
    for w in words:
        if cur:
            chars = sum(len(x.text) + 1 for x in cur) + len(w.text)
            if (len(cur) >= max_words or chars > max_chars or w.start - cur[-1].end > max_gap
                    or cur[-1].text.endswith((".", "?", "!", ","))):
                groups.append(cur)
                cur = []
        cur.append(w)
    if cur:
        groups.append(cur)
    return groups


def _wrap(text: str, width: int) -> str:
    words, lines, cur = text.split(), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > width:
            lines.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    if cur:
        lines.append(cur)
    return "\\N".join(lines)


def build_ass(path: Path, words: list[Word], width: int, height: int, *, kind: str, font: str,
              highlight: str, words_per_line: int = 3, hook: str | None = None,
              chapters: list[tuple[float, str]] | None = None, duration: float = 0.0,
              captions: bool = True) -> None:
    vertical = height > width
    base = min(width, height)
    hi = ass_color(highlight)
    if kind == "short":
        cap_size, cap_margin = int(base * 0.075), int(height * 0.27)
        cap_style = (f"Style: Caption,{font},{cap_size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,"
                     f"-1,0,0,0,100,100,1,0,1,{max(4, cap_size // 12)},2,2,60,60,{cap_margin},1")
    else:
        cap_size, cap_margin = int(base * 0.052), int(height * 0.07)
        cap_style = (f"Style: Caption,{font},{cap_size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,"
                     f"-1,0,0,0,100,100,0,0,1,{max(2, cap_size // 16)},1,2,120,120,{cap_margin},1")
    hook_size = int(base * (0.062 if vertical else 0.05))
    title_size = int(base * 0.045)

    lines = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {width}", f"PlayResY: {height}",
        "WrapStyle: 0", "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, "
        "Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, "
        "MarginL, MarginR, MarginV, Encoding",
        cap_style,
        f"Style: Hook,{font},{hook_size},&H00101010,&H00FFFFFF,&H00FFFFFF,&H00000000,-1,0,0,0,100,100,0,0,3,"
        f"{hook_size // 3},0,8,80,80,{int(height * 0.12)},1",
        f"Style: Chapter,{font},{title_size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,1,0,3,"
        f"{title_size // 3},0,7,80,80,80,1",
        "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]

    def event(start: float, end: float, style: str, text: str, layer: int = 0) -> None:
        if end - start > 0.01:
            lines.append(f"Dialogue: {layer},{ass_time(start)},{ass_time(end)},{style},,0,0,0,,{text}")

    if captions and words:
        if kind == "short":
            groups = group_words(words, words_per_line, 18)
            for gi, g in enumerate(groups):
                g_end = g[-1].end + 0.25
                if gi + 1 < len(groups):
                    g_end = min(g_end, groups[gi + 1][0].start)
                for wi, w in enumerate(g):
                    start = g[0].start if wi == 0 else w.start
                    end = g[wi + 1].start if wi + 1 < len(g) else g_end
                    parts = []
                    for k, x in enumerate(g):
                        t = _esc(x.text.upper())
                        if k == wi:
                            parts.append(f"{{\\c{hi}\\fscx115\\fscy115\\t(0,90,\\fscx100\\fscy100)}}{t}{{\\r}}")
                        else:
                            parts.append(t)
                    pop = "{\\fscx85\\fscy85\\t(0,80,\\fscx100\\fscy100)}" if wi == 0 else ""
                    event(start, end, "Caption", pop + " ".join(parts))
        else:
            for g in group_words(words, 9, 46, max_gap=0.8):
                end = g[-1].end + 0.3
                parts = []
                for x in g:
                    t = _esc(x.text)
                    # karaoke-style highlight that follows the speaker word by word
                    k = int(round((x.end - x.start) * 100))
                    parts.append(f"{{\\kf{k}}}{t}")
                event(g[0].start, end, "Caption", f"{{\\1c{hi}\\2c&H00FFFFFF&}}" + " ".join(parts))

    if hook:
        end = min(3.8, duration) if duration else 3.8
        text = _wrap(_esc(hook.upper() if vertical else hook), 20 if vertical else 40)
        event(0.15, end, "Hook", "{\\fad(120,250)\\fscx70\\fscy70\\t(0,200,\\fscx100\\fscy100)}" + text, layer=2)

    for t, title in chapters or []:
        y = int(height * 0.06)
        anim = f"{{\\an7\\move(-900,{y},{int(width * 0.04)},{y},0,350)\\fad(0,300)}}"
        event(t + 0.2, min(t + 3.4, duration or t + 3.4), "Chapter", anim + _esc(title), layer=2)

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_srt(path: Path, words: list[Word], max_words: int = 8) -> None:
    out = []
    for i, g in enumerate(group_words(words, max_words, 42, max_gap=0.8), 1):
        out += [str(i), f"{srt_time(g[0].start)} --> {srt_time(g[-1].end + 0.2)}", " ".join(w.text for w in g), ""]
    path.write_text("\n".join(out), encoding="utf-8")
