import { useAuth } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import type { App } from "@/lib/types/apps";
import { Check, ChevronsUpDown, Image, Loader2 } from "lucide-react";
import { platforms } from "@/lib/platforms";
import Logo from "@/components/logo";
import { z } from "zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { useDropzone } from "@uploadthing/react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import type { GetToken } from "@clerk/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  UncontrolledFormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatBytes } from "@/lib/bytes";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

export const Route = createLazyFileRoute("/$appId/settings")({
  component: AppSettings,
});

function AppSettings() {
  const { appId } = Route.useParams();
  const { getToken } = useAuth();

  const { isLoading, data: app } = useQuery({
    queryKey: ["app", { id: appId }],
    queryFn: async (): Promise<App> =>
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
    <div className="p-4 flex flex-col gap-3 flex-grow w-full max-w-3xl mx-auto">
      <Link
        to="/$appId"
        params={{ appId: app.id }}
        className="flex items-center gap-1.5"
      >
        {app.iconUrl ? (
          <img
            src={app.iconUrl}
            alt="App Icon"
            width={32}
            height={32}
            className="rounded-lg"
          />
        ) : app.platform ? (
          (() => {
            const platform = platforms.find(
              (platform) => platform.name === app.platform,
            );
            if (!platform)
              return <Logo width={32} height={32} className="text-primary" />;
            return (
              <platform.icon
                className="w-8 h-8"
                style={{ color: platform.color }}
              />
            );
          })()
        ) : (
          <Logo width={32} height={32} className="text-primary" />
        )}
        <h1 className="text-xl font-semibold truncate tracking-tight">
          {app.name}
        </h1>
      </Link>
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tighter">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure the settings for this app.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Adjust your app&apos;s metadata.</CardDescription>
        </CardHeader>
        <UpdateAppForm app={app} getToken={getToken} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            These actions are destructive and cannot be reversed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteApp app={app} getToken={getToken} />
        </CardContent>
      </Card>
    </div>
  );
}

const appUpdateSchema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string",
  }),
  iconUrl: z
    .string({
      invalid_type_error: "Icon must be a string",
    })
    .url({
      message: "Icon must be a URL",
    })
    .optional()
    .nullable(),
  platform: z
    .enum(platforms.map((platform) => platform.name) as [string, ...string[]], {
      invalid_type_error: "Invalid platform",
    })
    .optional(),
  icon: z
    .unknown()
    .refine((val) => {
      if (!Array.isArray(val)) return false;
      if (val.some((file) => !(file instanceof File))) return false;
      return true;
    }, "Must be an array of File")
    .optional()
    .nullable()
    .default(null),
});

function UpdateAppForm({ app, getToken }: { app: App; getToken: GetToken }) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof appUpdateSchema>>({
    resolver: zodResolver(appUpdateSchema),
    disabled: isLoading,
    defaultValues: {
      name: app.name,
      platform: app.platform ?? undefined,
      icon: [],
      iconUrl: app.iconUrl ?? undefined,
    },
  });

  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { startUpload, permittedFileInfo } = useUploadThing("appIcon");

  const fileTypes = permittedFileInfo?.config
    ? Object.keys(permittedFileInfo?.config)
    : [];

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
  });

  async function onSubmit(values: z.infer<typeof appUpdateSchema>) {
    setIsLoading(true);

    const options: {
      id: string;
      name: string;
      platform?: string | null;
      iconUrl?: string | null;
    } = {
      id: app.id,
      name: values.name,
      platform: values.platform,
    };
    if (!values.iconUrl) {
      options.iconUrl = null;
    }
    if (files.length > 0) {
      const uploads = await startUpload(files);
      if (!uploads) return;
      options.iconUrl = uploads[0].url;
    }

    await fetch(`${import.meta.env.VITE_API_URL}/api/updateApp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getToken()}`,
      },
      body: JSON.stringify(options),
    });

    queryClient.invalidateQueries({ queryKey: ["apps"] });
    queryClient.invalidateQueries({ queryKey: ["app", { id: app.id }] });
    queryClient.invalidateQueries({
      queryKey: ["appWithToken", { id: app.id }],
    });
    toast.success("App updated", {
      classNames: {
        title: "!font-semibold",
      },
      style: {
        fontFamily: "var(--font-geist-sans)",
      },
    });

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col gap-2">
                  <FormLabel>Name</FormLabel>
                  <FormDescription>
                    This will be the name of the app shown on the dashboard.
                  </FormDescription>
                </div>
                <FormControl>
                  <Input placeholder="GitHub" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <div className="flex flex-col gap-2">
              <FormLabel>Token</FormLabel>
              <FormDescription>
                This will be the 2FA token from{" "}
                {form.watch().platform
                  ? `${form.watch().platform}`
                  : "the original platform such as GitHub"}
                .
              </FormDescription>
            </div>
            <FormControl>
              <Input
                type="password"
                placeholder="•••••••••••••••••••"
                disabled
              />
            </FormControl>
            <p className="text-destructive text-sm">
              For security reasons, tokens cannot be viewed or updated.
            </p>
          </FormItem>
          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-col gap-2">
                  <FormLabel>Platform</FormLabel>
                  <FormDescription>
                    The platform for this app. The platform&apos;s icon will be
                    shown as the icon in the dashboard.
                  </FormDescription>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={files.length > 0}
                        className="w-[200px] justify-between"
                      >
                        {field.value
                          ? (() => {
                              const platform = platforms.find(
                                (platform) => platform.name === field.value,
                              )!;
                              return (
                                <div className="flex items-center">
                                  <platform.icon
                                    className="mr-2 h-4 w-4"
                                    style={{
                                      color: platform.color,
                                    }}
                                  />
                                  {platform.name}
                                </div>
                              );
                            })()
                          : "Custom"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search platform..." />
                      <ScrollArea className="h-96">
                        <CommandEmpty>No platform found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="Custom"
                            onSelect={() => {
                              form.setValue("platform", "");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value ? "opacity-0" : "opacity-100",
                              )}
                            />
                            Custom
                          </CommandItem>
                          {platforms.map((platform) => (
                            <CommandItem
                              value={platform.name}
                              key={platform.name}
                              onSelect={() => {
                                form.setValue("platform", platform.name);
                              }}
                            >
                              {platform.name === field.value ? (
                                <Check className="mr-2 h-4 w-4" />
                              ) : (
                                <platform.icon
                                  className="mr-2 h-4 w-4"
                                  style={{
                                    color: platform.color,
                                  }}
                                />
                              )}
                              {platform.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </ScrollArea>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <div className="flex flex-col gap-2">
              <FormLabel>Icon</FormLabel>
              <FormDescription>
                This will be the icon shown in the dashboard next to the
                app&apos;s name.
              </FormDescription>
            </div>
            <FormControl>
              <div
                {...getRootProps()}
                className={cn(
                  "p-6 border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer border-input ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isLoading || !!form.watch().platform
                    ? "opacity-50 cursor-not-allowed"
                    : null,
                )}
              >
                <input
                  {...getInputProps()}
                  disabled={isLoading || !!form.watch().platform}
                />
                <Image className="w-12 h-12 text-primary" />
                {files.length > 0 ? (
                  <div className="flex flex-col items-center justify-center">
                    <h1 className="text-xl font-bold tracking-tighter">
                      {files[0].name}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      {formatBytes(files[0].size, 1)}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <h1 className="text-xl font-bold tracking-tighter">
                      Drag and drop an image here
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      or click to select an image
                    </p>
                  </div>
                )}
                {(files.length > 0 || form.watch().iconUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (form.watch().iconUrl && files.length <= 0)
                        form.setValue("iconUrl", undefined);
                      else setFiles([]);
                    }}
                  >
                    Remove image
                  </Button>
                )}
              </div>
            </FormControl>
            <UncontrolledFormMessage
              message={form.formState.errors.icon?.message}
            />
          </FormItem>
        </CardContent>
        <CardFooter className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={
              isLoading ||
              (!form.formState.isDirty &&
                (form.watch().platform === app.platform ||
                  form.watch().iconUrl === app.iconUrl))
            }
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save changes"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={
              isLoading ||
              (!form.formState.isDirty &&
                (form.watch().platform === app.platform ||
                  form.watch().iconUrl === app.iconUrl))
            }
          >
            Undo changes
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}

function DeleteApp({ app, getToken }: { app: App; getToken: GetToken }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function onClick() {
    setIsLoading(true);

    await fetch(`${import.meta.env.VITE_API_URL}/api/deleteApp`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${await getToken()}`,
      },
      body: JSON.stringify({
        id: app.id,
      }),
    });

    queryClient.invalidateQueries({ queryKey: ["apps"] });
    queryClient.invalidateQueries({ queryKey: ["app", { id: app.id }] });
    queryClient.invalidateQueries({
      queryKey: ["appWithToken", { id: app.id }],
    });
    navigate({ to: "/" });
    toast.success("App deleted", {
      classNames: {
        title: "!font-semibold",
      },
      style: {
        fontFamily: "var(--font-geist-sans)",
      },
    });

    setOpen(false);
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent disableXIcon className="w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete this app?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={onClick} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Delete app"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
