import {
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <SignOutButton />
      </SignedIn>
    </div>
  );
}
