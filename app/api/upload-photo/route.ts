import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import sharp from "sharp";

// ✅ FREE TIER: 10 second max
export const maxDuration = 10; 
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const galleryId = formData.get("galleryId") as string;

    if (!file || !galleryId) {
      return NextResponse.json(
        { error: "Missing file or galleryId" },
        { status: 400 }
      );
    }

    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`📤 Uploading: ${file.name} (${originalSizeMB}MB)`);

    // ✅ STRICT LIMIT for FREE tier: Reject files > 20MB
    // (Even compressed, they'll likely timeout at 10 seconds)
    if (file.size > 20_000_000) {
      return NextResponse.json(
        { 
          error: `File too large (${originalSizeMB}MB). Maximum 20MB.
          
Please export photos with these settings:
- Resolution: 4000×3000px max
- JPEG Quality: 85-90%
- Target size: Under 15MB for best results` 
        },
        { status: 413 }
      );
    }

    // Convert to buffer
    let bytes = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(bytes);

    // ✅ AGGRESSIVE COMPRESSION for files > 8MB (to stay under 10s timeout)
    if (file.size > 8_000_000) {
      console.log(`🗜️ Compressing ${originalSizeMB}MB file...`);
      
      try {
        // More aggressive compression for larger files
        const quality = file.size > 15_000_000 ? 88 : 92;
        
        buffer = await sharp(buffer)
          .jpeg({
            quality: quality,
            mozjpeg: true,
          })
          .toBuffer();

        const newSizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        console.log(`✅ Compressed: ${originalSizeMB}MB → ${newSizeMB}MB (${quality}% quality)`);
      } catch (compressionError) {
        console.warn("⚠️ Compression failed:", compressionError);
      }
    }

    // Convert to base64
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    console.log("☁️ Uploading to Cloudinary...");

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: `photo-delivery-app/${galleryId}`,
      resource_type: "auto",
      chunk_size: 6000000,
      timeout: 60000, // 1 minute (server-side timeout, not Vercel)
    });

    console.log("✅ Upload complete!");

    return NextResponse.json({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error("❌ Upload failed:", error);

    // Handle timeout specifically
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: "Upload timed out. Please compress your photo to under 10MB and try again." },
        { status: 408 }
      );
    }

    if (error.message?.includes('too large')) {
      return NextResponse.json(
        { error: "File too large. Please compress to under 15MB." },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}