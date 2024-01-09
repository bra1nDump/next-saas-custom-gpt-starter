"use client";

import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { type User } from "next-auth";
import Image from "next/image";
import useScroll from "~/react-hooks/use-scroll";

export default function ClientNavbar(props: { prefetchedUser?: User }) {
  // get current pathname nextjs hook
  const pathname = usePathname();

  // To avoid flickering on every page load, we start with the prefetched user
  // Was still use useSession to get the latest user data (for example if the user signs out we
  // want to catch that)
  // Idea: If useSession cashed the user, we would not have to do this workaround
  const user = useSession().data?.user ?? props.prefetchedUser;

  const scrolled = useScroll(50);

  return (
    <Navbar
      maxWidth="full"
      className={`justify-between ${
        scrolled ? "border-b border-b-divider" : "bg-background/0"
      }`}
    >
      <NavbarContent>
        <NavbarItem>
          {/* <AcmeLogo /> */}

          <Link href="/">
            <p className="font-bold text-inherit">Cool Product</p>
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        <NavbarContent justify="center">
          {[["Pricing", "/pricing"]].map(([title, path]) => (
            <NavbarItem isActive={pathname === path} key={title}>
              <Link href={path}>{title}</Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          {user ? (
            <Dropdown>
              <DropdownTrigger>
                {/* Avatar it was not used because it causes flickering on route changes, we need some next magic to fix some next problems */}

                <Image
                  src={
                    user.image ??
                    // https://lucide.dev/icons/circle-user
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIwLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2lyY2xlLXVzZXItcm91bmQiPjxwYXRoIGQ9Ik0xOCAyMGE2IDYgMCAwIDAtMTIgMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjQiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjwvc3ZnPg=="
                  }
                  width={32}
                  height={32}
                  className="rounded-full"
                  alt="user image"
                />
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Dynamic Actions"
                items={[
                  {
                    label: "Manage Plan",
                    onClick: () => {
                      window.location.href = "/pricing";
                    },
                  },
                  {
                    label: "Sign Out",
                    onClick: () => {
                      void signOut();
                    },
                  },
                ]}
              >
                {(item) => (
                  <DropdownItem
                    key={item.label}
                    color={item.label === "Sign Out" ? "warning" : "secondary"}
                    className={
                      item.label === "Sign Out"
                        ? "text-warning"
                        : "text-primary"
                    }
                    onClick={item.onClick}
                  >
                    {item.label}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button as={Link} color="primary" href="/account" variant="flat">
              Sign In / Sign Up
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
