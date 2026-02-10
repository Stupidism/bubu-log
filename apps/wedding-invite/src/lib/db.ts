import { sql } from "@vercel/postgres";

export interface RSVPData {
  id: string;
  name: string;
  guest_count: number;
  phone: string;
  message: string;
  status: "attending" | "not_attending" | "pending";
  submitted_at: string;
}

// Initialize the RSVP table
export async function initRSVPTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rsvp (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        guest_count INTEGER DEFAULT 1,
        phone VARCHAR(50),
        message TEXT,
        status VARCHAR(20) DEFAULT 'attending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("RSVP table initialized");
  } catch (error) {
    console.error("Failed to initialize RSVP table:", error);
    throw error;
  }
}

// Get all RSVPs
export async function getAllRSVPs(): Promise<RSVPData[]> {
  const { rows } = await sql<RSVPData>`
    SELECT 
      id::text,
      name,
      guest_count,
      phone,
      message,
      status,
      submitted_at
    FROM rsvp 
    ORDER BY submitted_at DESC
  `;
  return rows;
}

// Create a new RSVP
export async function createRSVP(data: {
  name: string;
  guestCount: number;
  phone: string;
  message: string;
  status: string;
}): Promise<RSVPData> {
  const { rows } = await sql<RSVPData>`
    INSERT INTO rsvp (name, guest_count, phone, message, status)
    VALUES (${data.name}, ${data.guestCount}, ${data.phone}, ${data.message}, ${data.status})
    RETURNING 
      id::text,
      name,
      guest_count,
      phone,
      message,
      status,
      submitted_at
  `;
  return rows[0];
}

// Delete an RSVP
export async function deleteRSVP(id: string): Promise<void> {
  await sql`DELETE FROM rsvp WHERE id = ${id}`;
}
