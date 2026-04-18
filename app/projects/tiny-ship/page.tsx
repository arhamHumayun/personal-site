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
  badge: "Game Development",
};

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
      </div>
    </ProjectLayout>
  );
}
