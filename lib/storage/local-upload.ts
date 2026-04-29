import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "waste-photos";

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
  const storagePath = [...params.folder, name].join("/");

  const bytes = Buffer.from(await params.file.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType: params.file.type || "image/jpeg",
      upsert: false,
    });

  if (error) throw new Error(`Upload gagal: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return {
    path: storagePath,
    publicUrl: data.publicUrl,
    mimeType: params.file.type || "image/jpeg",
  };
}
