// app/api/delete-photo/route.ts (Next.js 13+)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: "Missing public_id" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary config missing" }, { status: 500 });
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    // Delete image via Cloudinary API
    const formData = new URLSearchParams();
    formData.append("public_id", public_id);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.result !== "ok") {
      return NextResponse.json({ error: "Failed to delete image", data }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
