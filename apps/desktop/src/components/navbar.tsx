import { ModeToggle } from "@/components/themes";
import Logo from "@/components/logo";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserResource } from "@clerk/types";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const { user } = useUser();

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-muted">
      <div className="flex items-center gap-1 text-primary">
        <Logo width={32} height={32} />
        <p className="text-xl font-bold tracking-tighter">authenable</p>
      </div>
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
      <DropdownMenuContent className="w-40" align="end">
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
        <DropdownMenuItem
          onClick={() => signOut()}
          className="flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
