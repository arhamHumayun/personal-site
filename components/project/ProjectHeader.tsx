import React from 'react';
import Image from 'next/image';
import { H1, P } from '@/components/typography';

interface ProjectHeaderProps {
  title: string;
  description: string;
  image?: string;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ title, description, image }) => {
  return (
    <div className="mb-8">
      {image && (
        <div className="relative w-full h-64 mb-6">
          <Image
            src={image}
            alt={title}
            fill
            style={{ objectFit: 'contain' }}
            className="rounded-lg bg-white dark:bg-zinc-900"
            priority
          />
        </div>
      )}
      <H1 className="mt-2 mb-2">{title}</H1>
      <P className="text-muted-foreground text-lg mb-2">{description}</P>
    </div>
  );
}; 