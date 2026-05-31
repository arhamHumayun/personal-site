import React from 'react';

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children }) => {
  return (
    <article className="w-full">
      {children}
    </article>
  );
}; 