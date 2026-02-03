"use client";

import Link from "next/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "./ui/navigation-menu";
import { Button } from "./ui/button";
import { useState } from "react";
import { Menu } from "lucide-react";

const navItems = [
  {
    label: "Blog",
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
  {
    label: "Favorites",
    href: "/favorites",
  },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:py-4 px-4 sm:px-6 z-50 bg-background w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between w-full sm:w-auto">
        <Link href="/" className="font-semibold text-base sm:text-lg leading-none">
          <span className="block">Arham Humayun</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="sm:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      
      <NavigationMenu className={`${isOpen ? 'block' : 'hidden'} sm:block w-full sm:w-auto mt-2 sm:mt-0`}>
        <NavigationMenuList className="flex-col sm:flex-row gap-1 sm:gap-2">
          {navItems.map((item) => (
            <NavigationMenuItem key={item.label}>
              <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                <Link href={item.href} className="text-xs sm:text-sm">
                  {item.label}
                </Link>
              </Button>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
