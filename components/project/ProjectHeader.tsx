import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { H1, P } from '@/components/typography';

interface ProjectHeaderProps {
  title: string;
  description?: string;
  image?: string;
  href?: string;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ title, description, image, href }) => {
  const frame = "relative block w-full h-64 mb-6 overflow-hidden rounded-lg bg-muted/40";
  const img = image && (
    <Image
      src={image}
      alt={title}
      fill
      className="object-contain"
      priority
    />
  );

  return (
    <div className="mb-8">
      {img && (href ? (
        <Link
          href={href}
          className={`${frame} outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50`}
        >
          {img}
        </Link>
      ) : (
        <div className={frame}>{img}</div>
      ))}
      <H1 className="mt-2 mb-2">{title}</H1>
      {description && <P className="text-muted-foreground text-lg mb-2">{description}</P>}
    </div>
  );
};
