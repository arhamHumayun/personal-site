import { FeaturedProject } from "@/components/home/FeaturedProject";

interface ProjectGridItem {
  slug: string;
  title: string;
  description: string;
  img: string;
}

interface ProjectGridProps {
  projects: ProjectGridItem[];
  showIndex?: boolean;
}

export function ProjectGrid({ projects, showIndex = false }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      {projects.map((project, i) => (
        <FeaturedProject
          key={project.slug}
          title={project.title}
          description={project.description}
          img={project.img}
          href={`/projects/${project.slug}`}
          index={showIndex ? i + 1 : undefined}
        />
      ))}
    </div>
  );
}
