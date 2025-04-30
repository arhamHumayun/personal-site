import { H1 } from "@/components/typography";
import ProjectCard from "@/components/ui/ProjectCard";
import fs from "fs";
import path from "path";

// Get all project slugs (folder names)
async function getProjectSlugs() {
  const projectsDirectory = path.join(process.cwd(), "app/projects");
  const dirents = await fs.promises.readdir(projectsDirectory, { withFileTypes: true });
  return dirents.filter(d => d.isDirectory() && !d.name.startsWith("."))
    .map(d => d.name);
}

// Get metadata for a single project
async function getProjectMetadata(slug: string) {
  try {
    const mod = await import(`./${slug}/page`);
    return { slug, ...mod.metadata };
  } catch {
    return { slug, title: slug, description: "No description.", img: "", url: "" };
  }
}

export default async function Projects() {
  const slugs = await getProjectSlugs();
  const projects = await Promise.all(slugs.map(slug => getProjectMetadata(slug)));

  return (
    <div className="max-w-5xl mx-auto">
      <H1 className="mb-5 px-4">My Projects</H1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {projects.map(project => (
          <ProjectCard
            key={project.slug}
            title={project.title}
            img={project.img}
            desc={project.description}
            url={`/projects/${project.slug}`}
          />
        ))}
      </div>
    </div>
  );
}