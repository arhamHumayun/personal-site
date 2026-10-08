---
title: "I had Claude write my game's soundtrack in Python"
date: "2026-10-06"
---

In my quest to add some life to Tiny Ship, I had run into the hard problem of finding music to put into the game. The game is a very simple twin-stick shooter with roguelike elements and borrows a lot from Kingdom Hearts 2 in terms of gameplay mechanics. I wanted a fun, intense, yet enjoyable track that plays while you’re blasting ships.

At first I tried to find copyright free music to put in and this was actually what I had for quite some time. This will always be a limited approach and I always ended up feeling like I just put some random track that could potentially fit for my game, rather than something bespoke. Then I tried AI music generators like SUNO, but they cost subscription money and I found that while the output was fairly decent, it always had this unnatural feeling about them. I couldn't change a bar, make a harder version for a later stage, or reuse a theme across levels.

I stumbled upon a method that consistently made fitting music that sounded fantastic and it only requires access to a coding model. I have only used Sonnet 5.5 and Opus 5.5. Nearly all of my current tracks are made with Sonnet 5.5.

The only other dependencies you need are Python, numpy, scipy and ffmpeg.

[github.com/arhamHumayun/synth-music-kit](https://github.com/arhamHumayun/synth-music-kit)

This github repo contains the music lib that was created during my experimentation in creating music. I’ve added a few things to make it easier for you and your agents to pick up and start using immediately.

To try it, clone the repo, install the requirements and render the starter song:

```bash
pip install -r requirements.txt
python examples/hello_loop.py
```

Then open the folder in your coding agent and describe the song you want.

### How it works (in short)

- Instruments are math. Every sound is synthesized from numpy/scipy—no samples—so it’s original and safe to ship. Functions like `lead_note`, `bell_note`, `pluck`, and a procedural drum kit live under `synthkit/`.
- A song is code on a 16‑step grid. Notes are tiny tuples: `(bar_offset, step, midi, length)`. You arrange layers—pad, bass, drums, melody—bar by bar with an `Arranger`.
- The renderer mixes, checks the loop seam, and writes an `.ogg` via `ffmpeg`, targeting a consistent LUFS so tracks match in‑game.

Here’s the smallest complete example straight from `examples/hello_loop.py`—progression, a four‑note tune, and a few layers:

```python
BPM, BARS = 100, 8
AM, F, C, G = (9, "min"), (5, "maj"), (0, "maj"), (7, "maj")
PROGRESSION = [AM, F, C, G]
TUNE = [(0, 0, 76, 4), (0, 6, 72, 2), (0, 8, 69, 6), (1, 0, 72, 4), (1, 6, 77, 2), (1, 8, 76, 6),
        (2, 0, 79, 4), (2, 6, 76, 2), (2, 8, 72, 6), (3, 0, 74, 8), (3, 8, 71, 8)]

def build():
    A = Arranger(BPM, BARS, seed=1)
    for bar in range(BARS):
        chord = PROGRESSION[bar % 4]
        A.pad(bar, chord, voice="strings_sus", gain=0.7)
        A.bass(bar, chord, style="8th", gain=0.9)
        A.drums(bar, "rock" if bar >= 2 else "half", 0.9)
    for bar0 in (0, 4):
        A.melody("lead", TUNE, bar0, "lead", scale=A_MINOR)
    return A.finish(STEMS, cfg)
```

Patterns are reusable too. The strings ostinato is literally a little table of indices in `arranger.py`:

```python
OSTINATO = [0, 2, 3, 2, 0, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2]
```

And rendering is one line (writes a looping `.ogg`, or `.wav` if `ffmpeg` isn’t on PATH):

```python
render_track("hello-loop", build, STEMS, out_dir="out")
```

### The agent skills this ships with

The repo includes small Claude skills in `.claude/skills/` so an agent “knows” how to work with the kit.

- Compose a track (`compose-track`): sets the plan before any code.

  > “Agree, in a few lines, on: where it plays (menu, level, boss), the feel, tempo and key, how long, and what repeats.  
  > Propose a motif… Prefer an idea that survives being transposed or re‑orchestrated, since games reuse themes across levels.”

- Read the render (`read-the-render`): interpret numbers, not vibes.

  > “One line per instrument: RMS dBFS… Look for a stem missing, one stem 8 dB above neighbours, melody far below accompaniment…  
  > Keep every track in one game at the same target (examples use −15.5 LUFS).”

There’s also an “add‑instrument” skill for writing a new synthesized voice that fits the conventions.

### Results

You’ll notice that the main theme and menu theme share tunes.

![Stage 1 theme (short version): the tune fast, on a saw lead](/audio/stage1-short.mp3)

![Menu theme (short version): the same tune at half speed, on bells and a soft lead](/audio/menu-short.mp3)

I also tried acoustic instruments. Everything here is still computed from scratch, no recordings. The guitar and piano are the most convincing, the cello and flute the least.

![Porch Light: a folk piece from guitar, upright bass, piano, cello, flute and a soft drum kit](/audio/porch-light.mp3)

I also added a small jukebox to Tiny Ship so you can listen to the whole soundtrack. You can play it in the browser: [Tiny Ship](https://eggsdee99.itch.io/tiny-ship).

### My loop with the agent

- Start with a concept chat (compose‑track’s step 2): where this plays, feel, tempo, key, how long, what repeats. We pick a motif on purpose—a short rhythm or interval shape that can survive re‑orchestration—because I’ll reuse it in stage and menu themes.
- Rough it in code: chords, a tiny tune, a drum groove. Keep tuned numbers named, keep notes in tables (the kit enforces this).
- Render fast, then read the report (not guess): stem balance, loop seam, LUFS. Tweak `STEMS` and try again.
- Make several concepts and promote the favorites to full songs. Reuse motifs across tracks by changing key, speed, or instrument family. That's what makes the music feel like one story, and it’s why the stage and menu themes above sound related.
- Don’t over‑spec the mechanics; high‑level direction worked better for me. First outputs are rarely the keeper—iterate.
- You don’t need theory to start. If you can describe “too shrill / too empty / busier drums,” the agent can translate it.

