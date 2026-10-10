"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Track {
  title: string;
  file: string;
}

interface SoundtrackProps {
  title: string;
  artist: string;
  cover: string;
  basePath: string;
  tracks: Track[];
}

const pad = (n: number) => String(n).padStart(2, "0");

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "--:--";
  return `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
};

export function Soundtrack({ title, artist, cover, basePath, tracks }: SoundtrackProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(NaN);
  const autoplay = useRef(false);

  const track = tracks[current];

  useEffect(() => {
    const a = audioRef.current;
    if (a && autoplay.current) {
      a.play().catch(() => setPlaying(false));
    }
  }, [current]);

  const select = (i: number) => {
    if (i === current) {
      const a = audioRef.current;
      if (!a) return;
      if (a.paused) a.play().catch(() => {});
      else a.pause();
      return;
    }
    autoplay.current = true;
    setTime(0);
    setDuration(NaN);
    setCurrent(i);
  };

  const step = (d: number) => select((current + d + tracks.length) % tracks.length);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration)) return;
    a.currentTime = (Number(e.target.value) / 1000) * a.duration;
  };

  const progress = Number.isFinite(duration) && duration > 0 ? (time / duration) * 1000 : 0;

  return (
    <div className="not-prose rounded-md border border-border bg-card lcd-bezel overflow-hidden">
      <audio
        ref={audioRef}
        src={`${basePath}/${track.file}.mp3`}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (current < tracks.length - 1) step(1);
          else {
            autoplay.current = false;
            setPlaying(false);
          }
        }}
      />

      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:p-5">
        <div className="relative mx-auto aspect-square w-40 shrink-0 sm:mx-0 sm:w-44">
          <div
            aria-hidden
            className="absolute inset-0 translate-x-3 rounded-full border border-border bg-foreground/90"
            style={{
              backgroundImage:
                "repeating-radial-gradient(circle, transparent 0 2px, color-mix(in oklch, var(--background) 10%, transparent) 2px 3px)",
            }}
          />
          <div className="relative size-full overflow-hidden rounded-sm border border-border lcd-bezel bg-background">
            <Image src={cover} alt={`${title} cover`} fill sizes="176px" className="object-cover" />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
          <div>
            <p className="meta-label">Original Soundtrack</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {artist} · {tracks.length} tracks · all synthesized, no samples
            </p>
          </div>

          <div>
            <p className="meta-label text-link/85 truncate">
              {playing ? "Now playing" : "Selected"} · {pad(current + 1)}
            </p>
            <p className="truncate font-medium text-foreground">{track.title}</p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous track"
                className="meta-label hover:text-foreground"
              >
                ◂◂
              </button>
              <button
                type="button"
                onClick={() => select(current)}
                aria-label={playing ? "Pause" : "Play"}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-85"
              >
                <span className="font-mono text-xs">{playing ? "❚❚" : "▶"}</span>
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next track"
                className="meta-label hover:text-foreground"
              >
                ▸▸
              </button>
              <input
                type="range"
                min={0}
                max={1000}
                value={progress}
                onChange={seek}
                aria-label="Seek"
                className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--link)]"
              />
              <span className="meta-label tabular-nums shrink-0">
                {fmt(time)} / {fmt(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ol className="border-t border-dashed border-border">
        {tracks.map((t, i) => {
          const active = i === current;
          return (
            <li key={t.file}>
              <button
                type="button"
                onClick={() => select(i)}
                className={cn(
                  "group flex w-full items-center gap-4 px-4 py-2.5 text-left transition-colors hover:bg-accent/60 sm:px-5",
                  active && "bg-accent/70"
                )}
              >
                <span
                  className={cn(
                    "meta-label w-6 tabular-nums",
                    active && "text-link"
                  )}
                >
                  {active && playing ? "▶" : pad(i + 1)}
                </span>
                <span
                  className={cn(
                    "flex-1 truncate text-sm",
                    active ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {t.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
