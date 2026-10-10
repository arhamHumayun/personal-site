import { ProjectLayout } from "@/components/project/ProjectLayout";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { P } from "@/components/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Soundtrack } from "@/components/project/Soundtrack";
import { SectionHeading } from "@/components/home/SectionHeading";

export const metadata = {
  title: "Tiny Ship",
  cardDescription:
    "Top-down twin-stick shooter in Godot, playable in the browser.",
  description:
    "A fast top-down twin-stick shooter built in Godot: survive waves, pick upgrades each level, use abilities and drive forms, and spend meta gold between runs. Playable in the browser on itch.io.",
  img: "/images/tiny-ship.webp",
  url: "https://arham99.itch.io/tiny-ship",
};

const soundtrack = [
  { title: "Menu theme", file: "menu-theme" },
  { title: "Stage 1 Level", file: "stage-1-level" },
  { title: "Stage 1 Boss", file: "stage-1-boss" },
  { title: "Stage 2 Level", file: "stage-2-level" },
  { title: "Stage 2 Boss", file: "stage-2-boss" },
  { title: "Stage 3 Level", file: "stage-3-level" },
  { title: "Stage 3 Boss", file: "stage-3-boss" },
  { title: "Stage 4 Level", file: "stage-4-level" },
  { title: "Stage 4 Boss", file: "stage-4-boss" },
  { title: "Final Boss (concept 1)", file: "final-boss-concept-1" },
  { title: "Final Boss (concept 2)", file: "final-boss-concept-2" },
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
          Tiny Ship is a roguelite twin-stick shooter I{`'`}m building in Godot
          4. You move and aim independently, fight through waves, choose
          upgrades each level, and unlock more options with gold between runs —
          abilities (fire, ice, heal, magnet, rush, missiles), MP, and swappable
          drive forms. HTML5 and desktop builds are on itch.io; the prototype is
          free to play.
        </P>
        <Button asChild variant="link" className="p-0 mt-2">
          <Link
            href="https://arham99.itch.io/tiny-ship"
            target="_blank"
            rel="noopener noreferrer"
          >
            Play on itch.io
          </Link>
        </Button>
        <br></br>
        <Button asChild variant="link" className="p-0 mt-1">
          <Link href="/projects/synth-music-kit">synth-music-kit</Link>
        </Button>
        <SectionHeading>Soundtrack</SectionHeading>
        <Soundtrack
          title="Tiny Ship"
          artist="Arham Humayun"
          cover={metadata.img}
          basePath="/audio/tiny-ship"
          tracks={soundtrack}
        />
        <P>
          Every track is synthesized from scratch, no samples. In the game they
          loop seamlessly; here they play once through. I wrote about how they
          were made in{" "}
          <Link href="/blog/how-i-made-music-for-my-game" className="underline">
            this post
          </Link>
          .
        </P>
      </div>
    </ProjectLayout>
  );
}
