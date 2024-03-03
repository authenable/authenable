import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import type { App } from "@/lib/types/apps";
import { ArrowLeft, ClipboardCopy, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as OTPAuth from "otpauth";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { platforms } from "@/lib/platforms";
import Logo from "@/components/logo";

export const Route = createLazyFileRoute("/$appId")({
  component: AppPage,
});

interface Token {
  userId: string;
  token: string;
}

function AppPage() {
  const { appId } = Route.useParams();
  const { getToken } = useAuth();

  const { isLoading, data: app } = useQuery({
    queryKey: ["app", { id: appId }],
    queryFn: async (): Promise<App & { decodedToken: Token }> =>
      fetch(`${import.meta.env.VITE_API_URL}/api/getApp/${appId}`, {
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

  if (!app) return null;

  return (
    <div className="flex flex-col gap-3 flex-grow items-center justify-center w-full max-w-xl mx-auto">
      <Link
        to="/"
        className={buttonVariants({
          variant: "ghost",
          className:
            "absolute top-[calc(1rem+61px)] left-4 flex items-center gap-1",
        })}
      >
        <ArrowLeft className="w-5 h-5" /> Apps
      </Link>
      {app.iconUrl ? (
        <img
          src={app.iconUrl}
          alt="App Icon"
          width={128}
          height={128}
          className="rounded-lg"
        />
      ) : app.platform ? (
        (() => {
          const platform = platforms.find(
            (platform) => platform.name === app.platform,
          );
          if (!platform)
            return <Logo width={128} height={128} className="text-primary" />;
          return (
            <platform.icon
              className="w-32 h-32"
              style={{ color: platform.color }}
            />
          );
        })()
      ) : (
        <Logo width={80} height={80} className="text-primary" />
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{app.name}</h1>
      <TOTP token={app.decodedToken.token} />
    </div>
  );
}

// TODO: allow this to be a setting in infra
const digits = 6;
const period = 30;

const circumference = ((2 * 22) / 7) * 120;

const getCurrentSeconds = () => Math.round(new Date().getTime() / 1000.0);

function truncateTo(str: string, digits: number) {
  if (str.length <= digits) {
    return str;
  }

  return str.slice(-digits);
}

function TOTP({ token }: { token: string }) {
  const totp = useMemo(
    () =>
      new OTPAuth.TOTP({
        algorithm: "SHA1",
        digits,
        period,
        secret: OTPAuth.Secret.fromBase32(token),
      }),
    [token],
  );

  const [updatingIn, setUpdatingIn] = useState(
    period - (getCurrentSeconds() % period),
  );
  const [otp, setOtp] = useState<string>(truncateTo(totp.generate(), digits));

  useEffect(() => {
    function update() {
      setUpdatingIn(period - (getCurrentSeconds() % period));
      setOtp(truncateTo(totp.generate(), digits));
    }
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [totp]);

  function copyOtp() {
    navigator.clipboard.writeText(otp);
    toast.success("Code copied to clipboard", {
      classNames: {
        title: "!font-semibold",
      },
      style: {
        fontFamily: "'Geist Sans'",
      },
    });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-2">
        <p className="text-5xl font-bold text-center">{otp}</p>
        <Button variant="outline" size="icon" onClick={copyOtp}>
          <ClipboardCopy />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <p>Expiring in:</p>
        <div className="flex items-center justify-center">
          <svg
            className="transform -rotate-90 w-16 h-16"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 288 288"
          >
            <circle
              cx="145"
              cy="145"
              r="120"
              stroke="currentColor"
              strokeWidth="30"
              fill="transparent"
              className="text-gray-100 dark:text-gray-800"
            />
            <circle
              cx="145"
              cy="145"
              r="120"
              stroke="currentColor"
              strokeWidth="30"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={
                circumference -
                ((((period - updatingIn) / 30) * 100) / 100) * circumference
              }
              className="text-blue-500"
            />
          </svg>
          <span className="absolute text-xl font-semibold">{updatingIn}</span>
        </div>
      </div>
    </div>
  );
}
