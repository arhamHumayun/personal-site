import React from 'react';
import Image from 'next/image';
import { H1, P } from '@/components/typography'; // Assuming these are appropriate

interface BlogPostHeaderProps {
  title: string;
  description: string;
  date: string;
  heroImage?: string;
}

export const BlogPostHeader: React.FC<BlogPostHeaderProps> = ({ title, description, date, heroImage }) => {
  return (
    <div className="mb-8"> {/* Add some bottom margin */}
      {/* Optional: Display Hero Image */}
      {heroImage && (
        <div className="relative w-full h-64 sm:h-96 mb-8">
          <Image
            src={heroImage}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            priority // Load hero image faster
            className="rounded-lg"
          />
        </div>
      )}

      <H1 className='mt-4'>{title}</H1>
      <P className="text-muted-foreground text-lg">{description}</P>
      <P className="text-sm text-muted-foreground">Published on: {date}</P>
    </div>
  );
}; 