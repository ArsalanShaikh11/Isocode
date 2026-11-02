import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { branch: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email or select a demo account." },
        { status: 401 }
      );
    }

    // For demo convenience, allow standard demo password or match hash
    if (password && password !== "Password@123" && password !== "demo_hash_pwd123") {
      return NextResponse.json(
        { error: "Invalid password for this demo account." },
        { status: 401 }
      );
    }

    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "OFFICER" | "MANAGER",
      branchId: user.branchId,
      phone: user.phone,
    });

    // Record audit event
    await db.auditEvent.create({
      data: {
        userId: user.id,
        action: "USER_SIGN_IN",
        details: JSON.stringify({ role: user.role, email: user.email }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branch?.name,
      },
    });
  } catch (err: unknown) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "Authentication service error" },
      { status: 500 }
    );
  }
}
