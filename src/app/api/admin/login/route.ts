import { NextResponse } from "next/server";
import { createAdminSession, getAdminCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const creds = getAdminCredentials();

    if (
      email?.trim().toLowerCase() === creds.email.toLowerCase() &&
      password === creds.password
    ) {
      await createAdminSession(creds.email);
      return NextResponse.json({ success: true, email: creds.email });
    }

    return NextResponse.json(
      { success: false, error: "Invalid email or password" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
