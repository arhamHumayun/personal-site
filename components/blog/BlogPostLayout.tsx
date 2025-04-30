import React from 'react';

interface BlogPostLayoutProps {
  children: React.ReactNode;
}

export const BlogPostLayout: React.FC<BlogPostLayoutProps> = ({ children }) => {
  return (
    <article className="prose dark:prose-invert text-wrap max-w-5xl mx-auto px-4 sm:px-8 min-w-0 w-full -mx-4 sm:mx-0">
      {children}
    </article>
  );
}; 