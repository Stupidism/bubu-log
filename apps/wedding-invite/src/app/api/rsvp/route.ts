import { NextRequest, NextResponse } from "next/server";
import { getAllRSVPs, createRSVP, initRSVPTable } from "@/lib/db";

// Initialize table on first request
let tableInitialized = false;

async function ensureTable() {
  if (!tableInitialized) {
    await initRSVPTable();
    tableInitialized = true;
  }
}

export async function GET() {
  try {
    await ensureTable();
    const rsvps = await getAllRSVPs();
    return NextResponse.json(rsvps);
  } catch (error) {
    console.error("Failed to fetch RSVPs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    const body = await request.json();
    
    const rsvp = await createRSVP({
      name: body.name,
      guestCount: parseInt(body.guestCount) || 1,
      phone: body.phone || "",
      message: body.message || "",
      status: body.status || "attending",
    });

    return NextResponse.json({ success: true, data: rsvp }, { status: 201 });
  } catch (error) {
    console.error("Failed to create RSVP:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save RSVP" },
      { status: 500 }
    );
  }
}
