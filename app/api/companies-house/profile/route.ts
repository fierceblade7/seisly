import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const number = req.nextUrl.searchParams.get("number");
  if (!number) {
    return NextResponse.json({ error: "Company number is required" }, { status: 400 });
  }

  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Companies House API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.company-information.service.gov.uk/company/${encodeURIComponent(number)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Companies House API error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch company profile" }, { status: 500 });
  }
}
