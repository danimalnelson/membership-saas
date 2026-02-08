import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { put, del } from "@vercel/blob";
import sharp from "sharp";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 512;
const WEBP_QUALITY = 80;

// Only raster formats — SVGs are excluded due to XSS risk
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
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
    const businessId = formData.get("businessId") as string | null;
    const oldUrl = formData.get("oldUrl") as string | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Require businessId
    if (!businessId) {
      return NextResponse.json({ error: "Business ID required" }, { status: 400 });
    }

    // Verify the user has OWNER or ADMIN access to this business
    const membership = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to upload for this business" },
        { status: 403 }
      );
    }

    // Validate MIME type (client-reported — sharp validates actual content below)
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: PNG, JPEG, WebP, GIF" },
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

    // sharp validates magic bytes — rejects non-image files even if MIME was spoofed
    const outputBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation, then strip metadata
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "cover",
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // Namespace by businessId to prevent cross-business collisions
    const filename = `logos/${businessId}/${Date.now()}.webp`;

    // Upload to Vercel Blob
    const blob = await put(filename, outputBuffer, {
      access: "public",
      contentType: "image/webp",
    });

    // Delete old blob if replacing (only our own Vercel Blob URLs scoped to this business)
    if (
      oldUrl &&
      oldUrl.includes(".vercel-storage.com") &&
      oldUrl.includes(`logos/${businessId}/`)
    ) {
      try {
        await del(oldUrl);
      } catch {
        // Ignore deletion errors (file may already be gone)
      }
    }

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error("Upload error:", error);

    // sharp throws on corrupt/non-image files — return a friendly message
    if (error?.message?.includes("Input buffer contains unsupported image format")) {
      return NextResponse.json(
        { error: "File does not appear to be a valid image" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
