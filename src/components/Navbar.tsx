"use client";

import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@nextui-org/react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar } from "@nextui-org/react";

import { useState } from "react";

export default function AppNavbar() {
  // get current pathname nextjs hook
  const pathname = usePathname();

  const user = useSession().data?.user;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <Navbar className="justify-between">
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
            <div className="relative">
              <Avatar
                src={user.image ?? undefined}
                size="sm"
                radius="full"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              />
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 rounded border border-gray-200 bg-white py-2 shadow-lg">
                  <Button
                    onPress={() => {
                      setIsDropdownOpen(false);
                      void signOut();
                    }}
                  >
                    <p className="hover:bg-gray-100">Sign Out</p>
                  </Button>
                </div>
              )}
            </div>
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
