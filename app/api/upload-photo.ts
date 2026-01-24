import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await cloudinary.uploader.upload_stream(
      { folder: "photo-delivery" },
      (error, result) => {
        if (error) throw error;
        return result;
      }
    );

    // Convert buffer to readable stream for Cloudinary
    const stream = require("stream");
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(upload);

    // Wait for result
    const result: any = await new Promise((resolve, reject) => {
      upload.on("finish", resolve);
      upload.on("error", reject);
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
};
