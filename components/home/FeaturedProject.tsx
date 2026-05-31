import Image from "next/image";
import Link from "next/link";

interface FeaturedProjectProps {
  title: string;
  description: string;
  img: string;
  href: string;
}

export function FeaturedProject({
  title,
  description,
  img,
  href,
}: FeaturedProjectProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg border border-border transition-colors duration-300 group-hover:border-link/35">
        <Image
          src={img}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <h3 className="mt-3 font-semibold group-hover:underline underline-offset-4">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
