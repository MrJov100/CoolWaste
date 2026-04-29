import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function savePublicUpload(params: {
  file: File;
  folder: string[];
  prefix?: string;
}) {
  const bytes = await params.file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const folder = params.folder.join("/");

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: "image" }, (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload gagal"));
          resolve(result);
        })
        .end(buffer);
    }
  );

  return {
    path: result.public_id,
    publicUrl: result.secure_url,
    mimeType: params.file.type || "image/jpeg",
  };
}
