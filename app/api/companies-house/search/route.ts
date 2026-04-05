import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const chLimiter = rateLimit({ name: 'companies-house-search', maxRequests: 30, windowMs: 60 * 60 * 1000 });

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const { success } = await chLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Companies House API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(q)}&items_per_page=5`,
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
    const items = (data.items || []).map((c: Record<string, unknown>) => ({
      company_name: c.title || c.company_name,
      company_number: c.company_number,
      date_of_creation: c.date_of_creation,
      registered_office_address: c.registered_office_address
        ? {
            address_line_1: (c.registered_office_address as Record<string, unknown>).address_line_1 || "",
            address_line_2: (c.registered_office_address as Record<string, unknown>).address_line_2 || "",
            locality: (c.registered_office_address as Record<string, unknown>).locality || "",
            postal_code: (c.registered_office_address as Record<string, unknown>).postal_code || "",
          }
        : { address_line_1: "", address_line_2: "", locality: "", postal_code: "" },
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to search Companies House" }, { status: 500 });
  }
}
