import { NextResponse } from "next/server";
import { getCVDataAction } from "@/src/app/actions";

export async function GET() {
  try {
    const data = await getCVDataAction();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}