interface SectionHeadingProps {
  children: React.ReactNode;
}

export function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-3 mt-14 mb-6">
      <span className="text-xs text-link/80 font-medium tracking-widest uppercase">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
