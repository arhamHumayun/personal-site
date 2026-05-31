import React from "react";
import Image from "next/image";
import { H1 } from "@/components/typography";
import { PostDate } from "@/components/ui/post-date";

interface BlogPostHeaderProps {
  title: string;
  date: string;
  heroImage?: string;
}

export const BlogPostHeader: React.FC<BlogPostHeaderProps> = ({ title, date, heroImage }) => {
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
      <div className="mt-4 flex items-center gap-2 meta-label">
        <span className="text-link/70">DATE</span>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <PostDate date={date} variant="compact" className="text-foreground/70" />
      </div>
    </div>
  );
}; 