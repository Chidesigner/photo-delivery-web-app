import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const { public_id } = await req.json();

    console.log("🗑️ Delete request received:", { public_id });

    if (!public_id) {
      return NextResponse.json(
        { error: "Missing public_id" },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    console.log("Cloudinary delete result:", result);

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error("Failed to delete from Cloudinary");
    }

    return NextResponse.json({ success: true, result: result.result });
  } catch (error: any) {
    console.error("❌ Delete error:", error);
    return NextResponse.json(
      { error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}