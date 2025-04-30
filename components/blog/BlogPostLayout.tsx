import React from 'react';

interface BlogPostLayoutProps {
  children: React.ReactNode;
}

export const BlogPostLayout: React.FC<BlogPostLayoutProps> = ({ children }) => {
  return (
    <article className="prose dark:prose-invert text-wrap max-w-5xl mx-auto px-4 sm:px-8 prose-img:max-w-full prose-img:rounded-lg prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:text-sm sm:prose-pre:text-base">
      {children}
    </article>
  );
}; 