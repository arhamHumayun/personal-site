import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: "Race Telemetry Dashboard",
  description: "Created REST APIs in Go with MongoDB to add race car and user information, delivering historical and real-time data with user permissions. Built the front-end dashboard using TypeScript, React and Bootstrap.",
  img: "/images/sr.webp",
  url: "https://github.com/UCalgaryRacing/STMDisplay",
  badge: "Data Visualization"
};

export default function RaceTelemetryDashboard() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        description={metadata.description}
        image={metadata.img}
      />
      <P>
        Created REST APIs in Go with MongoDB to add race car and user information, delivering historical and real-time data with user permissions. Built the front-end dashboard using TypeScript, React and Bootstrap.
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