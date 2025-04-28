import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export const metadata = {
  title: "Embedded Racecar Display",
  description: "Programmed a race car dashboard in embedded C using STM32 chipset with ARM processor for car diagnosis and racing display. Optimized performance through custom drawing and refreshing implementations.",
  img: "/images/stm32.webp",
  url: "https://github.com/UCalgaryRacing/STMDisplay",
  badge: "Embedded"
};

export default function EmbeddedRacecarDisplay() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        description={metadata.description}
        image={metadata.img}
      />
      <P>
        Programmed a race car dashboard in embedded C using STM32 chipset with ARM processor for car diagnosis and racing display.
        Optimized performance through custom drawing and refreshing implementations.
      </P>
      <Button
        asChild
        variant={'link'}
        className='p-0 mt-2'
      >
        <Link
          href="https://github.com/UCalgaryRacing/STMDisplay"
          prefetch={true}
          target="_blank"
        >
          View on GitHub
        </Link>
      </Button>
    </ProjectLayout>
  );
} 