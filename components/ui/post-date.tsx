import { formatPostDate } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface PostDateProps {
  date: string;
  variant?: "compact" | "long";
  className?: string;
}

export function PostDate({
  date,
  variant = "compact",
  className,
}: PostDateProps) {
  const formatted = formatPostDate(date, variant);
  if (!formatted) return null;

  return (
    <time
      dateTime={date}
      className={cn(
        "font-mono text-xs tabular-nums tracking-tight text-muted-foreground",
        className
      )}
    >
      {formatted}
    </time>
  );
}
