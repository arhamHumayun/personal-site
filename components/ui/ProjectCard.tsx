import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface ProjectCardProps {
  title: string;
  img: string;
  desc: string;
  url: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ title, img, desc, url }) => (
  <Link
    href={url}
    className="group flex items-start gap-5 py-6 border-b border-border last:border-b-0 focus-visible:ring-2 focus-visible:ring-primary/50 outline-none rounded-sm -mx-1 px-1"
  >
    <div className="relative w-28 sm:w-32 aspect-[4/3] shrink-0 overflow-hidden rounded-md bg-muted/40 ring-1 ring-border/60">
      <Image
        src={img}
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>

    <div className="flex-1 min-w-0 pt-0.5">
      <h2 className="text-lg font-semibold leading-snug group-hover:underline underline-offset-4">
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {desc}
      </p>
    </div>

    <ArrowUpRight
      aria-hidden
      className="size-4 shrink-0 mt-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
    />
  </Link>
);

export default ProjectCard;
