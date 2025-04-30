import Link from "next/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "./ui/navigation-menu";
import { Button } from "./ui/button";
import { H4 } from "./typography";

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
];

export function Navbar() {
  return (
    <div className="flex items-center justify-between p-4 z-50 bg-background w-full max-w-7xl mx-auto">
      <Link href="/" prefetch={true} className="font-bold text-lg">
        <H4>Arham Humayun</H4>
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          {navItems.map((item) => (
            <NavigationMenuItem key={item.label}>
              <Button variant="ghost" asChild>
                <Link href={item.href} prefetch={true} className="navigationMenuTriggerStyle()">
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