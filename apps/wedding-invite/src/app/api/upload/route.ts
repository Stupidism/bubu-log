import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Check if BLOB token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN not configured");
      return NextResponse.json(
        { success: false, error: "Blob storage not configured" },
        { status: 500 }
      );
    }

    // Generate unique filename
    const uniqueName = `${Date.now()}-${file.name}`;
    
    const blob = await put(uniqueName, file, {
      access: "public",
    });

    console.log("File uploaded successfully:", blob.url);

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        pathname: blob.pathname,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
