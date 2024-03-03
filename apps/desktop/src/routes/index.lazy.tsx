import Logo from "@/components/logo";
import { platforms } from "@/lib/platforms";
import type { App } from "@/lib/types/apps";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import { Loader2, Stars } from "lucide-react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const { getToken } = useAuth();

  const { isLoading, data: apps } = useQuery({
    queryKey: ["apps"],
    queryFn: async (): Promise<App[]> =>
      fetch(`${import.meta.env.VITE_API_URL}/api/getApps`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      }),
  });

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center flex-grow">
        <Loader2 className="w-20 h-20 animate-spin text-primary" />
      </div>
    );

  if (!apps) return null;

  return (
    <div className="flex flex-col gap-3 flex-grow">
      {apps.length ? (
        <div className="flex flex-col">
          {apps.map((app) => (
            <Link
              to="/$appId"
              params={{ appId: app.id }}
              className="border-b p-4 flex items-center gap-3 w-full"
              key={app.id}
            >
              {app.iconUrl ? (
                <img
                  src={app.iconUrl}
                  alt="App Icon"
                  width={56}
                  height={56}
                  className="rounded-lg"
                />
              ) : app.platform ? (
                (() => {
                  const platform = platforms.find(
                    (platform) => platform.name === app.platform,
                  );
                  if (!platform)
                    return (
                      <Logo width={56} height={56} className="text-primary" />
                    );
                  return (
                    <platform.icon
                      className="w-14 h-14"
                      style={{ color: platform.color }}
                    />
                  );
                })()
              ) : (
                <Logo width={56} height={56} className="text-primary" />
              )}
              <h1 className="text-3xl font-semibold truncate tracking-tight">
                {app.name}
              </h1>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center gap-2">
          <Stars className="w-12 h-12 text-primary" />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tighter">
              No Apps Found
            </h1>
            <p className="text-sm text-muted-foreground">
              Create an app to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
