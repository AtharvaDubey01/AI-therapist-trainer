import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/session";

export async function POST() {
  await logoutUser();
  return NextResponse.json({ success: true });
}
