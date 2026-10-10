import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: "Tiny Ship",
  cardDescription: "Top-down twin-stick shooter in Godot, playable in the browser.",
  description:
    "A fast top-down twin-stick shooter built in Godot: survive waves, pick upgrades each level, use abilities and drive forms, and spend meta gold between runs. Playable in the browser on itch.io.",
  img: "/images/tiny-ship.png",
  url: "https://arham99.itch.io/tiny-ship",
};

const soundtrack = [
  { title: "Menu Theme", info: "70 BPM, D minor. The hero's tune, slow and airy.", file: "menu-theme" },
  { title: "Stage 1", info: "140 BPM, D minor. The hero's tune, arcade style.", file: "gameplay-theme" },
  { title: "Stage 1 Boss", info: "150 BPM, E minor. A gallop riff leads and a falling tune climbs to a held high note.", file: "stage-boss-theme" },
  { title: "Stage 2", info: "135 BPM, D minor. The hero's tune, turned up.", file: "afterburn" },
  { title: "Stage 2 Boss", info: "150 BPM, E minor. A call and an answer in every bar. Not in a stage yet.", file: "stage-boss-theme-2" },
  { title: "Stage 3", info: "140 BPM, A minor. The villain's tune takes over.", file: "redline" },
  { title: "Stage 3 Boss", info: "150 BPM, E minor. A stomp on low brass, guitar and timpani, then a dark rise.", file: "stage-boss-theme-3" },
  { title: "Stage 4", info: "147 BPM, D minor to F minor. Every theme at once.", file: "zero-hour" },
  { title: "Stage 4 Boss", info: "150 BPM, E minor. A royal processional over a falling ground.", file: "stage-boss-theme-4" },
  { title: "Tyrant's Overture", info: "126 BPM, A minor. The villain's theme at full strength. Saved for the credits.", file: "tyrants-overture" },
  { title: "Final Boss", info: "150 BPM, A minor. The heaviest track. Not in a stage yet.", file: "tyrants-wrath" },
];

export default function TinyShip() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        description={metadata.description}
        image={metadata.img}
      />
      <div className="text-gray-700 dark:text-gray-300">
        <P>
          Tiny Ship is a roguelite twin-stick shooter I{`'`}m building in Godot 4. You move and aim
          independently, fight through waves, choose upgrades each level, and unlock more options
          with gold between runs — abilities (fire, ice, heal, magnet, rush, missiles), MP, and
          swappable drive forms. HTML5 and desktop builds are on itch.io; the prototype is free to
          play.
        </P>
        <Button asChild variant="link" className="p-0 mt-2">
          <Link href="https://arham99.itch.io/tiny-ship" target="_blank" rel="noopener noreferrer">
            Play on itch.io
          </Link>
        </Button>
        <Button asChild variant="link" className="p-0 mt-1">
          <Link href="/projects/synth-music-kit">synth-music-kit</Link>
        </Button>
        <h2 className="mt-8 text-xl font-semibold text-foreground">Soundtrack</h2>
        <P>
          Every track is synthesized from scratch, no samples. In the game they loop seamlessly;
          here they play once through. I wrote about how they were made in{" "}
          <Link href="/blog/how-i-made-music-for-my-game" className="underline">
            this post
          </Link>
          .
        </P>
        <ul className="mt-4 space-y-5">
          {soundtrack.map((t) => (
            <li key={t.file}>
              <p className="font-medium text-foreground">{t.title}</p>
              <p className="mb-1 text-sm">{t.info}</p>
              <audio
                controls
                preload="none"
                src={`/audio/tiny-ship/${t.file}.mp3`}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      </div>
    </ProjectLayout>
  );
}
