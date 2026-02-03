import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const galleryId = formData.get("galleryId") as string;

    console.log("📤 Upload request:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileSizeMB: file ? (file.size / 1024 / 1024).toFixed(2) + "MB" : "N/A",
      galleryId,
    });

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!galleryId) {
      return NextResponse.json(
        { error: "No gallery ID provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to base64 data URI
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    console.log("☁️ Uploading to Cloudinary with chunking...");

    // Upload to Cloudinary with chunked upload enabled
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: `photo-delivery-app/${galleryId}`,
      resource_type: "auto",
      chunk_size: 6000000, // ✅ 6MB chunks - enables large file uploads
      timeout: 120000, // 2 minutes timeout for large files
    });

    console.log("✅ Upload successful:", {
      url: uploadResult.secure_url,
      size: uploadResult.bytes,
      format: uploadResult.format,
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error("❌ Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}