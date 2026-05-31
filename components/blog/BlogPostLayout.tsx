import React from 'react';

interface BlogPostLayoutProps {
  children: React.ReactNode;
}

export const BlogPostLayout: React.FC<BlogPostLayoutProps> = ({ children }) => {
  return (
    <article className="prose dark:prose-invert text-wrap min-w-0 w-full">
      {children}
    </article>
  );
}; 