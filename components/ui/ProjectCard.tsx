import React from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import Link from "next/link";

interface ProjectCardProps {
  title: string;
  img: string;
  desc: string;
  url: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ title, img, desc, url }) => (
  <Link href={url} prefetch={true} className="block">
    <Card className="min-h-[400px] h-[400px] flex flex-col justify-between p-6">
      <div className="relative w-full aspect-[16/9]">
        <Image src={img} alt={title} fill className="object-cover rounded-md" />
      </div>
      <CardContent className="flex flex-col items-start w-full mt-4 p-0">
        <CardHeader className="p-0 pb-1 flex flex-col items-start w-full">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardDescription className="mt-2 w-full">
          {desc}
        </CardDescription>
      </CardContent>
    </Card>
  </Link>
);

export default ProjectCard; 