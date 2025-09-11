import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
    const p = path.join(process.cwd(), "public", "sample-btc.json");
    const file = await readFile(p, "utf-8");
    return NextResponse.json(JSON.parse(file));
}