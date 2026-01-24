import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { public_id, photoId } = await req.json();

    if (!public_id || !photoId) {
      return NextResponse.json(
        { error: "Missing public_id or photoId" },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result !== "ok") {
      console.error("Cloudinary deletion failed:", result);
      return NextResponse.json(
        { error: "Failed to delete image from Cloudinary", result },
        { status: 500 }
      );
    }

    // Delete from Supabase
    const { error } = await supabase.from("photos").delete().eq("id", photoId);

    if (error) {
      console.error("Supabase deletion failed:", error);
      return NextResponse.json(
        { error: "Failed to delete photo from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete photo error:", err);
    return NextResponse.json({ error: err.message || "Deletion failed" }, { status: 500 });
  }
}
