import { generateReactHelpers } from "@uploadthing/react";
export const { useUploadThing, uploadFiles } = generateReactHelpers<any>({
  url: `${import.meta.env.VITE_API_URL}/api/uploadthing`,
});
