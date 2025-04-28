import React from 'react';

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children }) => {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-8">
      {children}
    </article>
  );
}; 