import React from 'react';

interface BlogPostLayoutProps {
  children: React.ReactNode;
}

export const BlogPostLayout: React.FC<BlogPostLayoutProps> = ({ children }) => {
  return (
    <article className="prose dark:prose-invert text-wrap max-w-5xl mx-auto px-4">
      {children}
    </article>
  );
}; 