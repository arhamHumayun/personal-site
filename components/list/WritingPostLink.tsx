import { PostDate } from "@/components/ui/post-date";
import Link from "next/link";

interface WritingPostLinkProps {
  slug: string;
  title: string;
  description: string;
  date?: string;
}

export function WritingPostLink({
  slug,
  title,
  description,
  date,
}: WritingPostLinkProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block py-4 focus-visible:ring-2 focus-visible:ring-ring/50 outline-none"
    >
      <div className="flex justify-between gap-4 items-baseline">
        <h2 className="font-semibold group-hover:underline underline-offset-4">
          {title}
        </h2>
        {date && <PostDate date={date} className="shrink-0" />}
      </div>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
