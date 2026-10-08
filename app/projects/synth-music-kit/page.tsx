import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: "synth-music-kit",
  cardDescription:
    "A Python synth library that lets a coding agent compose real game music. It wrote the whole Tiny Ship soundtrack.",
  description:
    "A Python synth library that lets a coding agent compose real game music from code — no samples or recordings. It wrote the entire Tiny Ship soundtrack.",
  img: "/images/post_img.webp",
  url: "https://github.com/arhamHumayun/synth-music-kit",
};

export default function SynthMusicKit() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        description={metadata.description}
        image={metadata.img}
      />
      <div className="text-gray-700 dark:text-gray-300">
        <P>
          A lightweight synth toolkit in Python (numpy, scipy, ffmpeg) that lets a coding agent
          write real, reusable game music directly from code — no samples or recordings. It produced
          the whole Tiny Ship soundtrack.
        </P>
        <div className="flex flex-col gap-1 mt-2">
          <Button asChild variant="link" className="p-0">
            <Link
              href="https://github.com/arhamHumayun/synth-music-kit"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </Link>
          </Button>
          <Button asChild variant="link" className="p-0">
            <Link href="/blog/how-i-made-music-for-my-game">
              Read: How I made music for my game
            </Link>
          </Button>
        </div>
      </div>
    </ProjectLayout>
  );
}

