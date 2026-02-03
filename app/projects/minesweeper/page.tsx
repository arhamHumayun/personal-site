import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export const metadata = {
  title: "Minesweeper",
  description: "A complete remake of the classic Minesweeper game built with Pygame. One of my first projects exploring game development and Python programming.",
  img: "/images/minesweeper.webp",
  url: "https://github.com/arhamHumayun/Minesweeper",
  badge: "Game Development"
};

export default function Minesweeper() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        description={metadata.description}
        image={metadata.img}
      />
      <div className="text-gray-700 dark:text-gray-300">
        <P>
          A complete remake of the classic Minesweeper game built with Pygame. 
          One of my first projects exploring game development and Python programming.
          I built this game in 2020 when I was first learning Python and game programming so the code is a little questionable.
        </P>
        <Button
          asChild
          variant={'link'}
          className='p-0 mt-2'
        >
          <Link
            href="https://github.com/arhamHumayun/Minesweeper"
          >
            View on GitHub
          </Link>
        </Button>
      </div>
    </ProjectLayout>
  );
} 
