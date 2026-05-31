import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  isFirst?: boolean;
}

export function SectionHeading({
  children,
  className,
  isFirst,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 mb-6",
        isFirst ? "mt-0" : "mt-14",
        className
      )}
    >
      <span className="meta-label text-link/85 shrink-0">
        <span className="text-muted-foreground/60" aria-hidden>
          [
        </span>
        {children}
        <span className="text-muted-foreground/60" aria-hidden>
          ]
        </span>
      </span>
      <div className="flex-1 h-px bg-border border-dashed" />
    </div>
  );
}
