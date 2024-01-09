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
import { Avatar } from "@nextui-org/react";
import { type User } from "next-auth";

export default function ClientNavbar(props: { prefetchedUser?: User }) {
  // get current pathname nextjs hook
  const pathname = usePathname();

  // To avoid flickering on every page load, we start with the prefetched user
  // Was still use useSession to get the latest user data (for example if the user signs out we
  // want to catch that)
  // Idea: If useSession cashed the user, we would not have to do this workaround
  const user = useSession().data?.user ?? props.prefetchedUser;

  return (
    <Navbar maxWidth="full" className="justify-between">
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
                <Avatar
                  src={user.image ?? undefined}
                  size="sm"
                  radius="full"
                  classNames={{
                    // Removes the animation on the image - to further avoid flickering on page
                    // reloads - the image will be cached by the browser anyway
                    img: "!duration-0",
                  }}
                />
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Dynamic Actions"
                items={[{ label: "Sign Out", onClick: () => void signOut() }]}
              >
                {(item) => (
                  <DropdownItem
                    key={item.label}
                    color={item.label === "Sign Out" ? "warning" : "default"}
                    className={item.label === "Sign Out" ? "text-warning" : ""}
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
