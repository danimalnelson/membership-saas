import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import sharp from "sharp";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_SVG_SIZE = 200 * 1024; // 200KB
const MAX_DIMENSION = 512;
const WEBP_QUALITY = 80;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export async function POST(req: NextRequest) {
  // Authenticate
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const prefix = (formData.get("prefix") as string) || "uploads";
    const oldUrl = formData.get("oldUrl") as string | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: PNG, JPEG, WebP, GIF, SVG" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let outputBuffer: Buffer;
    let filename: string;
    let contentType: string;

    if (file.type === "image/svg+xml") {
      // SVGs: pass through with stricter size limit (no sharp processing)
      if (file.size > MAX_SVG_SIZE) {
        return NextResponse.json(
          { error: "SVG files must be under 200KB" },
          { status: 400 }
        );
      }
      outputBuffer = buffer;
      filename = `${prefix}/${Date.now()}.svg`;
      contentType = "image/svg+xml";
    } else {
      // Raster images: resize + convert to WebP
      outputBuffer = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF orientation, then strip metadata
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      filename = `${prefix}/${Date.now()}.webp`;
      contentType = "image/webp";
    }

    // Upload to Vercel Blob
    const blob = await put(filename, outputBuffer, {
      access: "public",
      contentType,
    });

    // Delete old blob if replacing (only if it's a Vercel Blob URL)
    if (oldUrl && oldUrl.includes(".vercel-storage.com")) {
      try {
        await del(oldUrl);
      } catch {
        // Ignore deletion errors (file may already be gone)
      }
    }

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
