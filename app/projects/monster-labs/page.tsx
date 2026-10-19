import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: "Monster Labs",
  cardDescription:
    "D&D creatures, items, spells, and sessions. Breed two monsters or start from a picture.",
  description:
    "Monster Labs is an AI tool for D&D. Describe a creature, item, spell, or session and it writes the stat block. You can also breed two monsters or start from a picture.",
  img: "/images/monsterlabs.webp",
  url: "https://monsterlabs.app",
};

export default function MonsterLabs() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        image={metadata.img}
      />
      <P>
        Monster Labs is an AI tool for D&D. Describe a creature, item, spell, or
        session and it writes the stat block. You can also breed two monsters or
        start from a picture.
      </P>
      <Button
        asChild
        variant={'link'}
        className='p-0 mt-2'
      >
        <Link
          href="https://monsterlabs.app"
          target="_blank"
        >
          Visit Monster Labs
        </Link>
      </Button>
    </ProjectLayout>
  );
} 
