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
        <NavigationMenu
          className={cn(
            "hidden min-[480px]:flex",
            isOpen && "max-[479px]:flex",
            "max-[479px]:absolute max-[479px]:left-0 max-[479px]:right-0 max-[479px]:top-full max-[479px]:flex-col max-[479px]:bg-background max-[479px]:border-b max-[479px]:py-3"
          )}
        >
          <NavigationMenuList className="max-[479px]:flex-col max-[479px]:items-start min-[480px]:flex-row gap-0">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <NavigationMenuItem key={item.label}>
                  <Button
                    variant="link"
                    size="sm"
                    asChild
                    className="max-[479px]:w-full min-[480px]:w-auto px-2"
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "text-sm transition-colors inline-flex items-center gap-0.5",
                        isActive
                          ? "text-link font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
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
            })}
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
    </div>
  );
}
