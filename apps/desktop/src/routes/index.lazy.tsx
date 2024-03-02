import {
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
  useAuth,
} from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const { getToken } = useAuth();

  const { isLoading, data } = useQuery({
    queryKey: ["apps"],
    queryFn: async () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/getApps`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      }),
  });

  if (true)
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <Loader2 className="w-20 h-20 animate-spin text-primary" />
      </div>
    );

  return <></>;
}
