import { getApiBaseUrl } from "~/lib/api-client";

type UploadImageResponse = {
  success: boolean;
  url?: string;
  filename?: string;
  error_msg?: string;
};

export async function uploadEditorImage(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${getApiBaseUrl()}/api/v1/upload/image`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const data = (await res.json().catch(() => null)) as UploadImageResponse | null;

  if (!res.ok || !data?.success || !data.url) {
    throw new Error(data?.error_msg || "图片上传失败");
  }

  return {
    url: data.url,
    filename: data.filename || file.name || "image",
  };
}
