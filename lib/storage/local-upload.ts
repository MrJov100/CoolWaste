import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function normalizeExtension(fileName: string, mimeType: string) {
  const fromName = fileName.split(".").pop()?.trim().toLowerCase();
  if (fromName) return fromName;

  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

export async function savePublicUpload(params: {
  file: File;
  folder: string[];
  prefix?: string;
}) {
  const extension = normalizeExtension(params.file.name, params.file.type);
  const name = `${params.prefix ?? Date.now().toString()}-${crypto.randomUUID()}.${extension}`;
  const relativePath = path.posix.join("uploads", ...params.folder, name);
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  const bytes = Buffer.from(await params.file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  return {
    path: relativePath,
    publicUrl: `/${relativePath}`,
    mimeType: params.file.type || "image/jpeg",
  };
}
