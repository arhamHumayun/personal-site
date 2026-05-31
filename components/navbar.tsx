"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "./ui/navigation-menu";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentNavPath, navItems } from "@/lib/nav-path";

function NavLinks({
  pathname,
  mobile = false,
  onNavigate,
}: {
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return navItems.map((item) => {
    const isActive =
      pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <NavigationMenuItem key={item.label} className={cn(mobile && "w-full")}>
        <Button
          variant="link"
          size="sm"
          asChild
          className={cn(
            mobile
              ? "h-auto w-full justify-start px-4 py-3.5"
              : "w-auto px-2"
          )}
        >
          <Link
            href={item.href}
            className={cn(
              "transition-colors inline-flex items-center",
              mobile ? "text-base gap-2" : "text-sm gap-0.5",
              isActive
                ? "text-link font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={cn(
                "inline-flex w-[0.5rem] shrink-0 justify-center font-mono text-[9px] leading-none",
                isActive ? "text-link" : "invisible"
              )}
              aria-hidden
            >
              ■
            </span>
            {item.label}
          </Link>
        </Button>
      </NavigationMenuItem>
    );
  });
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const currentPath = getCurrentNavPath(pathname);

  return (
    <div className="relative flex items-center justify-between py-4 z-50 bg-background/95 backdrop-blur-sm w-full border-b border-border/50">
      <div className="leading-none shrink-0">
        <Link
          href="/"
          className="font-semibold text-lg hover:text-link/90 transition-colors"
        >
          Arham Humayun
        </Link>
        <p
          className="mt-0.5 font-mono text-xs tracking-wide text-muted-foreground"
          aria-label={`Current location: ${currentPath}`}
        >
          {currentPath}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <NavigationMenu viewport={false} className="hidden min-[480px]:flex">
          <NavigationMenuList className="flex-row gap-0">
            <NavLinks pathname={pathname} />
          </NavigationMenuList>
        </NavigationMenu>
        <ThemeToggle className="min-[480px]:ml-4" />
        <Button
          variant="ghost"
          size="sm"
          className="min-[480px]:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <NavigationMenu
        viewport={false}
        className={cn(
          "min-[480px]:hidden",
          isOpen ? "flex" : "hidden",
          "absolute left-1/2 top-full z-50 w-screen max-w-none -translate-x-1/2 flex-col bg-background border-b px-4 py-4"
        )}
      >
        <NavigationMenuList className="w-full flex-col items-stretch gap-1">
          <NavLinks
            pathname={pathname}
            mobile
            onNavigate={() => setIsOpen(false)}
          />
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
