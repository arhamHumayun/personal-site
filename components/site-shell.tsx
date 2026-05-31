import { cn } from "@/lib/utils";

interface SiteShellProps {
  children: React.ReactNode;
  className?: string;
}

export function SiteShell({ children, className }: SiteShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-1 flex-col px-4",
        "border-x border-border/40",
        className
      )}
    >
      <div
        className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden
      />
      {children}
    </div>
  );
}
