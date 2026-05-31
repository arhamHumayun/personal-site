"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "./ui/navigation-menu";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  {
    label: "Writing",
    href: "/blog",
  },
  {
    label: "Projects",
    href: "/projects",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative flex items-center justify-between py-4 z-50 bg-background w-full">
      <Link href="/" className="font-semibold text-lg leading-none shrink-0">
        Arham Humayun
      </Link>

      <div className="flex items-center gap-1">
        <NavigationMenu
          className={cn(
            "hidden min-[480px]:flex",
            isOpen && "max-[479px]:flex",
            "max-[479px]:absolute max-[479px]:left-0 max-[479px]:right-0 max-[479px]:top-full max-[479px]:flex-col max-[479px]:bg-background max-[479px]:border-b max-[479px]:py-3"
          )}
        >
        <NavigationMenuList className="max-[479px]:flex-col max-[479px]:items-start min-[480px]:flex-row gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
            <NavigationMenuItem key={item.label}>
              <Button variant="link" size="sm" asChild className="max-[479px]:w-full min-[480px]:w-auto">
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm text-muted-foreground transition-colors",
                    isActive
                      ? "text-link font-medium"
                      : "hover:text-foreground"
                  )}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </Button>
            </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
        </NavigationMenu>
        <ThemeToggle />
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
