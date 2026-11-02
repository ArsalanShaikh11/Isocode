import { NextRequest, NextResponse } from "next/server";
import { checkContactWindow } from "@/lib/contact-window";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bypass = searchParams.get("bypass") === "true";

  const status = checkContactWindow({ simulationBypass: bypass });
  return NextResponse.json(status);
}
