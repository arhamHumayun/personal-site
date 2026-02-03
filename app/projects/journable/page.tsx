import { ProjectLayout } from '@/components/project/ProjectLayout';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export const metadata = {
  title: "Journable",
  description: "Winner of Best use of Machine Learning at the 2022 Calgary Hacks Hackathon. A modern journaling application powered by AI and machine learning to make writing journals more accessible for everyone.",
  img: "/images/journable.webp",
  url: "https://devpost.com/software/journable",
  badge: "Hackathon"
};

export default function Journable() {
  return (
    <ProjectLayout>
      <ProjectHeader
        title={metadata.title}
        description={metadata.description}
        image={metadata.img}
      />
      <P>
        Winner of Best use of Machine Learning at the 2022 Calgary Hacks Hackathon. A modern journaling application powered by AI and machine learning to make writing journals more accessible for everyone.
      </P>
      <Button
        asChild
        variant={'link'}
        className='p-0 mt-2'
      >
        <Link
          href="https://devpost.com/software/journable"
          target="_blank"
        >
          View on Devpost
        </Link>
      </Button>
    </ProjectLayout>
  );
} 
