import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: "Tabletop RPG Dice Roller",
  description: "One of my first projects! A tabletop RPG dice roller and character builder built with React and Bootstrap. It's a simple and easy to use dice roller for your tabletop RPG needs.",
  img: "/images/tth.webp",
  url: "https://arhamhumayun.github.io/Tabletop-Helper/#/dice"
};

export default function TabletopRPGDiceRoller() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        description={metadata.description}
        image={metadata.img}
      />
        <P>
          One of my first projects! A tabletop RPG dice roller and character builder built with React and Bootstrap. It&#39;s a simple and easy to use dice roller for your tabletop RPG needs.
        </P>
        <Button
          asChild
          variant={'link'}
          className='p-0 mt-2'
        >
          <Link
            href="https://arhamhumayun.github.io/Tabletop-Helper/#/dice"
            prefetch={true}
        >
          Try the Dice Roller
        </Link>
      </Button>
    </ProjectLayout>
  );
} 