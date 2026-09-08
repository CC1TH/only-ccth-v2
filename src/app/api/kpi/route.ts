import { NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export async function GET(request: Request) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: "❌ ไม่พบ APPS_SCRIPT_URL ในไฟล์ .env.local" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || "all";
    const month = searchParams.get("month") || "all";

    const res = await fetch(`${APPS_SCRIPT_URL}?year=${year}&month=${month}`, {
      next: { revalidate: 30 }
    });

    if (!res.ok) {
      return NextResponse.json({ error: `❌ Apps Script ตอบกลับด้วยรหัส ${res.status}` }, { status: 500 });
    }

    const text = await res.text();
    
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      return NextResponse.json({ error: "❌ ข้อมูลที่ได้ไม่ใช่ JSON (อาจจะเป็นหน้า Login หรือ 404)", raw: text.substring(0, 200) }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: `⚠️ Fetch Error: ${error.message}` }, { status: 500 });
  }
}