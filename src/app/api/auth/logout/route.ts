import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await db.auditEvent.create({
      data: {
        userId: user.id,
        action: "USER_SIGN_OUT",
        details: JSON.stringify({ email: user.email }),
      },
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
