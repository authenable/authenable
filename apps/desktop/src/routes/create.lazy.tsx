import { platforms } from "@/lib/platforms";
import { useAuth } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  ChevronsUpDown,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropzone } from "@uploadthing/react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { useUploadThing } from "@/lib/uploadthing";
import { useCallback, useState } from "react";
import { formatBytes } from "@/lib/bytes";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createLazyFileRoute("/create")({
  component: CreateApp,
});

const appSchema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string",
  }),
  token: z.string({
    required_error: "Token is required",
    invalid_type_error: "Token must be a string",
  }),
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

function CreateApp() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof appSchema>>({
    resolver: zodResolver(appSchema),
    disabled: isLoading,
    defaultValues: {
      icon: [],
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

  async function onSubmit(values: z.infer<typeof appSchema>) {
    setIsLoading(true);

    const options = {
      name: values.name,
      token: values.token,
      platform: values.platform,
      iconUrl: undefined as never as string | null,
    };
    if (files.length > 0) {
      const uploads = await startUpload(files);
      if (!uploads) return;
      options.iconUrl = uploads[0].url;
    }

    await fetch(`${import.meta.env.VITE_API_URL}/api/createApp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getToken()}`,
      },
      body: JSON.stringify(options),
    });

    queryClient.invalidateQueries({ queryKey: ["apps"] });
    navigate({
      to: "/",
    });

    setIsLoading(false);
  }

  return (
    <div className="p-4 flex flex-col gap-3 flex-grow">
      <h1 className="text-3xl font-bold tracking-tighter">
        Let&apos;s create an App
      </h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
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
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                              form.setValue("platform", undefined);
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
                <ImageIcon className="w-12 h-12 text-primary" />
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
                {files.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles([]);
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Create app"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
