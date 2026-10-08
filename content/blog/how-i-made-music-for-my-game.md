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

Here are some samples to showcase what’s in Tiny Ship! You’ll notice that the main theme, and menu theme share tunes.

![Stage 1 theme (short version): the tune fast, on a saw lead](/audio/stage1-short.mp3)

![Menu theme (short version): the same tune at half speed, on bells and a soft lead](/audio/menu-short.mp3)

I also tried acoustic instruments. Everything here is still computed from scratch, no recordings. The guitar and piano are the most convincing, the cello and flute the least.

![Porch Light: a folk piece from guitar, upright bass, piano, cello, flute and a soft drum kit](/audio/porch-light.mp3)

Some advice:

* Make several concepts and promote your favorites to full songs.
* Create motifs on purpose, a short tune or rhythm for each theme in your game (the hero, the villain, the bosses), and use them throughout the score. Play them faster, slower, in a different key or on different instruments. That's what makes the music feel like one story, and it's why the stage and menu themes above sound related.
* Beware of over-specifying how you want the song to mechanically play. Sometimes it’s best just to let the agent cook, some of my best results were given with only high level direction.
* Your first outputs may not be the best, keep iterating until you get something that sounds awesome. This may take several iterations.
* You may want to learn a few music terms but honestly don’t sweat it. SOTA LLMs these days are very good at interpreting how you feel about something.
