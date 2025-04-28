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
    <div className="flex items-center p-4 sticky top-0 z-50 bg-background">
      <Link href="/" className="font-bold text-lg">
        <H4>Arham Humayun</H4>
      </Link>
      <div className="flex-grow" />
      <NavigationMenu>
        <NavigationMenuList>
          {navItems.map((item) => (
            <NavigationMenuItem key={item.label}>
              <Button variant="ghost" asChild>
                <Link href={item.href} className="navigationMenuTriggerStyle()">
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