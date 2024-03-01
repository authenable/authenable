import Navbar from "@/components/navbar";
import { useAuth, useSignIn, useSignUp } from "@clerk/clerk-react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/logo";
import { type FormEvent, useLayoutEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OAuthStrategy } from "@clerk/types";
import { Button } from "@/components/ui/button";
import { FaGithub } from "react-icons/fa";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import OTPInput from "react-otp-input";

export const Route = createRootRoute({
  component: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuth();
    if (!auth.userId) return <Auth />;

    return (
      <>
        <Navbar />
        <Outlet />
      </>
    );
  },
});

type AuthState = "sign-in" | "sign-up";

function Auth() {
  const [state, setState] = useState<AuthState>("sign-in");

  const switchState = () =>
    setState((state) => (state === "sign-in" ? "sign-up" : "sign-in"));

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen">
      <div className="max-w-sm w-full">
        {state === "sign-in" ? (
          <SignIn switchState={switchState} />
        ) : (
          <SignUp switchState={switchState} />
        )}
      </div>
    </div>
  );
}

const signInSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email({
      message: "Invalid email address",
    }),
  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(8, {
      message: "Password must be more than 8 characters long",
    }),
});

function SignIn({ switchState }: { switchState: () => void }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    disabled: isLoading,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const completeSignIn = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (completeSignIn.status !== "complete") {
        console.log(JSON.stringify(completeSignIn, null, 2));
      }

      if (completeSignIn.status === "complete") {
        await setActive({ session: completeSignIn.createdSessionId });
      }
    } catch (err: any) {
      toast.error("Could not sign in", {
        classNames: {
          title: "!font-semibold",
          description: "text-xs",
        },
        style: {
          fontFamily: "'Geist Sans'",
        },
        description: err.errors?.[0]?.message ?? err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const signInWith = (strategy: OAuthStrategy) => {
    if (!isLoaded) return;

    setIsLoading(true);
    signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "https://authenable.codes/sso-callback",
      redirectUrlComplete: "/",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="text-primary pb-4 pointer-events-none">
          <Logo width={32} height={32} />
        </div>
        <CardTitle className="font-bold tracking-tighter">
          Sign in to Authenable
        </CardTitle>
        <CardDescription>
          Don&apos;t have an account?{" "}
          <button
            onClick={switchState}
            className="text-primary hover:underline"
          >
            Sign up
          </button>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          disabled={isLoading || !isLoaded}
          onClick={() => signInWith("oauth_github")}
        >
          {isLoading || !isLoaded ? (
            <Spinner />
          ) : (
            <FaGithub className="w-4 h-4" />
          )}{" "}
          Continue with GitHub
        </Button>
        <div className="relative flex w-full items-center my-1">
          <div className="flex-grow border-t border-muted-foreground"></div>
          <p className="mx-4 flex-shrink text-xs text-muted-foreground">OR</p>
          <div className="flex-grow border-t border-muted-foreground"></div>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="ami.efendov@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={showPassword ? "" : "•••••••••••••••••••"}
                        {...field}
                      />
                      <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400">
                        {showPassword ? (
                          <Eye
                            className="h-4 w-4"
                            onClick={togglePasswordVisibility}
                          />
                        ) : (
                          <EyeOff
                            className="h-4 w-4"
                            onClick={togglePasswordVisibility}
                          />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || !isLoaded}>
              {isLoading || !isLoaded ? <Spinner className="mr-2" /> : null}{" "}
              Sign in
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
          By signing in, you agree to our{" "}
          <a
            href="https://authenable.codes/terms"
            target="_blank"
            className="text-primary hover:underline"
          >
            Terms of Service
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  );
}

const signUpSchema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string",
  }),
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email({
      message: "Invalid email address",
    }),
  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(8, {
      message: "Password must be more than 8 characters long",
    }),
});

function SignUp({ switchState }: { switchState: () => void }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    disabled: isLoading || !isLoaded,
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const fullName = values.name.split(" ");

      await signUp.create({
        firstName: fullName[0],
        lastName: fullName.length > 1 ? fullName.slice(1).join(" ") : undefined,
        emailAddress: values.email,
        password: values.password,
      });
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setVerifying(true);
    } catch (err: any) {
      toast.error("Could not sign up", {
        classNames: {
          title: "!font-semibold",
          description: "text-xs",
        },
        style: {
          fontFamily: "'Geist Sans'",
        },
        description: err.errors?.[0]?.message ?? err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== "complete") {
        console.log(JSON.stringify(completeSignUp, null, 2));
      }

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
      }
    } catch (err: any) {
      toast.error("Could not verify email", {
        classNames: {
          title: "!font-semibold",
          description: "text-xs",
        },
        style: {
          fontFamily: "'Geist Sans'",
        },
        description: err.errors?.[0]?.message ?? err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const signUpWith = (strategy: OAuthStrategy) => {
    if (!isLoaded) return;

    setIsLoading(true);
    signUp.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/",
    });
  };

  if (verifying)
    return (
      <Card>
        <CardHeader>
          <div className="text-primary pb-4 pointer-events-none">
            <Logo width={32} height={32} />
          </div>
          <CardTitle className="font-bold tracking-tighter">
            Verify your email{" "}
          </CardTitle>
          <CardDescription>
            We sent you an email with a verification code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <OTPInput
                value={code}
                onChange={setCode}
                numInputs={6}
                renderInput={(props) => (
                  <Input
                    {...props}
                    inputMode={undefined}
                    disabled={isLoading}
                  />
                )}
                inputStyle={{ width: "3.15rem", textAlign: "center" }}
                containerStyle={{
                  gap: "0.4rem",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </div>
            <Button size="sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <div className="text-primary pb-4 pointer-events-none">
          <Logo width={32} height={32} />
        </div>
        <CardTitle className="font-bold tracking-tighter">
          Create an Authenable account
        </CardTitle>
        <CardDescription>
          Already have an account?{" "}
          <button
            onClick={switchState}
            className="text-primary hover:underline"
          >
            Sign in
          </button>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          disabled={isLoading || !isLoaded}
          onClick={() => signUpWith("oauth_github")}
        >
          {isLoading || !isLoaded ? (
            <Spinner />
          ) : (
            <FaGithub className="w-4 h-4" />
          )}{" "}
          Continue with GitHub
        </Button>
        <div className="relative flex w-full items-center my-1">
          <div className="flex-grow border-t border-muted-foreground"></div>
          <p className="mx-4 flex-shrink text-xs text-muted-foreground">OR</p>
          <div className="flex-grow border-t border-muted-foreground"></div>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ami Efendov" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="ami.efendov@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={showPassword ? "" : "•••••••••••••••••••"}
                        {...field}
                      />
                      <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400">
                        {showPassword ? (
                          <Eye
                            className="h-4 w-4"
                            onClick={togglePasswordVisibility}
                          />
                        ) : (
                          <EyeOff
                            className="h-4 w-4"
                            onClick={togglePasswordVisibility}
                          />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || !isLoaded}>
              {isLoading || !isLoaded ? <Spinner className="mr-2" /> : null}{" "}
              Create account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
          By creating an account, you agree to our{" "}
          <a
            href="https://authenable.codes/terms"
            target="_blank"
            className="text-primary hover:underline"
          >
            Terms of Service
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  );
}

let stashedTime: number;

function useSynchronizedAnimation<T = undefined>(animationName: string) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const animations = document
      .getAnimations()
      .filter(
        (animation) => (animation as any).animationName === animationName,
      );

    const myAnimation = animations.find(
      (animation) => (animation as any).effect.target === ref.current,
    );

    if (myAnimation === animations[0] && stashedTime) {
      myAnimation.currentTime = stashedTime;
    }

    if (myAnimation !== animations[0]) {
      myAnimation!.currentTime = animations[0].currentTime;
    }

    return () => {
      if (myAnimation === animations[0]) {
        stashedTime = myAnimation?.currentTime as number;
      }
    };
  }, [animationName]);

  return ref;
}

function Spinner({ className }: { className?: string }) {
  const ref = useSynchronizedAnimation<SVGSVGElement>("spinner");
  return (
    <Loader2 className={cn("w-4 h-4 animate-spin", className)} ref={ref} />
  );
}
