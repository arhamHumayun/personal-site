import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: "Monster Labs",
  description: "Monster Labs is a SaaS platform that helps you create Dungeons & Dragons monsters, characters, and magic items. Live and serving real customers!",
  img: "/images/monsterlabs.webp",
  url: "https://monsterlabs.app",
  badge: "SaaS"
};

export default function MonsterLabs() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        description={metadata.description}
        image={metadata.img}
      />
      <P>
        Monster Labs is a SaaS platform that helps you create Dungeons & Dragons monsters, characters, and magic items. 
        Live and serving real customers!
        </P>
        <Button
          asChild
          variant={'link'}
          className='p-0 mt-2'
        >
          <Link
            href="https://monsterlabs.app"
            prefetch={true}
            target="_blank"
          >
            Visit Monster Labs
        </Link>
      </Button>
    </ProjectLayout>
  );
} 