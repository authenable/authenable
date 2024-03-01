import { ModeToggle } from "@/components/themes";
import Logo from "@/components/logo";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserResource } from "@clerk/types";
import { AppWindow, LogOut, UserIcon } from "lucide-react";

export default function Navbar() {
  const { user } = useUser();

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-muted">
      <Link
        to="/"
        className="flex items-center gap-1 hover:opacity-75 transition-all text-primary"
      >
        <Logo width={32} height={32} />
        <p className="text-xl font-bold tracking-tighter">authenable</p>
      </Link>
      <div className="flex items-center gap-2">
        <ModeToggle />
        {user ? <UserDropdown user={user} /> : null}
      </div>
    </nav>
  );
}

function UserDropdown({ user }: { user: UserResource }) {
  const { signOut } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {user.hasImage ? (
          <img
            src={user.imageUrl}
            alt="User Image"
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            {(user.firstName ??
              user.emailAddresses.find(
                (email) => email.id === user.primaryEmailAddressId,
              )!.emailAddress)!.at(0)}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuLabel className="flex flex-col space-y-1 font-normal">
          <p className="font-semibold leading-none truncate">
            {user.firstName}
            {user.lastName ? ` ${user.lastName}` : null}
          </p>
          <p className="text-xs text-muted-foreground leading-none font-normal truncate">
            {
              user.emailAddresses.find(
                (email) => email.id === user.primaryEmailAddressId,
              )!.emailAddress
            }
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-1.5">
          <UserIcon className="w-4 h-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="flex items-center gap-1.5">
          <Link href="/apps">
            <AppWindow className="w-4 h-4" /> Apps
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          onClick={() => signOut()}
          className="flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
