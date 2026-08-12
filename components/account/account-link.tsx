"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { UserIcon } from "@heroicons/react/24/outline";
import type { User } from "lib/types";
import { AUTH_EVENT, getCurrentUser, logout } from "lib/persistence/users";

export function AccountLink({ className }: { className?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sync = () => setUser(getCurrentUser());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AUTH_EVENT, sync);
    };
  }, []);

  const signOut = () => {
    logout();
    setUser(null);
  };

  return (
    <Menu>
      {({ open }) => (
        <div
          className="relative"
          onMouseEnter={() => {
            if (!open) {
              buttonRef.current?.click();
            }
          }}
          onMouseLeave={() => {
            if (open) {
              buttonRef.current?.click();
            }
          }}
        >
          <MenuButton
            ref={buttonRef}
            aria-label={user ? "Account" : "Sign in"}
            className={`flex items-center gap-2 ${className ?? ""}`}
          >
            <UserIcon className="h-6 w-6" />
            <span className="hidden text-sm lg:block">
              {user ? `Hello, ${user.name.split(" ")[0]}` : "Sign in"}
            </span>
          </MenuButton>
          <MenuItems
            transition
            anchor="bottom end"
            className="z-50 mt-2 w-52 origin-top-right rounded-lg border border-neutral-200 bg-white p-1 text-sm shadow-lg transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <MenuItem>
              <Link
                href="/account"
                className="block rounded-md px-3 py-2 text-black hover:bg-neutral-100"
              >
                Account
              </Link>
            </MenuItem>
            <MenuItem>
              <Link
                href="/account"
                className="block rounded-md px-3 py-2 text-black hover:bg-neutral-100"
              >
                Orders
              </Link>
            </MenuItem>
            <MenuItem>
              <Link
                href="/wishlist"
                className="block rounded-md px-3 py-2 text-black hover:bg-neutral-100"
              >
                Wishlist
              </Link>
            </MenuItem>
            {user ? (
              <MenuItem>
                <button
                  type="button"
                  onClick={signOut}
                  className="block w-full rounded-md px-3 py-2 text-left text-black hover:bg-neutral-100"
                >
                  Sign out
                </button>
              </MenuItem>
            ) : (
              <MenuItem>
                <Link
                  href="/login"
                  className="block rounded-md px-3 py-2 text-black hover:bg-neutral-100"
                >
                  Sign in
                </Link>
              </MenuItem>
            )}
          </MenuItems>
        </div>
      )}
    </Menu>
  );
}
