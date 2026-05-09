import axios from "axios";

const SHEETS_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || "";

export interface SheetRow {
  // Report fields (written by useReport submit)
  timestamp?: string;
  type?: string;
  location?: string;
  severity?: string;
  status?: string;
  description?: string;
  lat?: string;
  lng?: string;
  id?: string;
  name?: string;
  phone?: string;
  // IoT sensor fields (written by ESP32 devices)
  "Record Time"?: string;
  RL_Speed?: number | string;
  TL_Speed?: number | string;
  ZOSS_Speed?: number | string;
  RL_Light?: string;
  TL_Light?: string;
  ZOSS_LED_Color?: string;
  ZOSS_Button?: string;
  [key: string]: unknown;
}

/** Normalise a raw sheet row into a consistent shape for the history page. */
export function normaliseSheetRow(r: SheetRow, index: number): SheetRow {
  // If the row already has report-style fields, return as-is
  if (r.type) return r;
  // Otherwise it's an IoT sensor row — map to a display-friendly shape
  const ts = (r["Record Time"] as string | undefined) ?? new Date().toISOString();
  return {
    ...r,
    id:          `sheet-iot-${index}-${ts}`,
    timestamp:   ts,
    type:        "Data Sensor IoT",
    location:    "—",
    severity:    "low",
    status:      "resolved",
    description: [
      r.RL_Light   ? `RL: ${r.RL_Light}, ${r.RL_Speed ?? 0} km/h`   : null,
      r.TL_Light   ? `TL: ${r.TL_Light}, ${r.TL_Speed ?? 0} km/h`   : null,
      r.ZOSS_Button ? `ZoSS: ${r.ZOSS_Button}, LED ${r.ZOSS_LED_Color ?? "—"}` : null,
    ].filter(Boolean).join(" | ") || "—",
  };
}

/**
 * Append a row to the Google Sheet via Apps Script Web App.
 * The Apps Script doPost() handler should write e.parameter fields as a new row.
 */
export async function appendToSheet(data: Record<string, unknown>): Promise<void> {
  if (!SHEETS_URL) return;
  // Apps Script expects form-encoded or JSON body depending on your doPost impl.
  // We send JSON and let the script parse e.postData.contents.
  await axios.post(SHEETS_URL, data, {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Fetch all rows from the Google Sheet.
 * Apps Script doGet() should return JSON: { data: SheetRow[] }
 */
export async function fetchFromSheet(): Promise<SheetRow[]> {
  if (!SHEETS_URL) return [];
  try {
    const res = await axios.get<{ data: SheetRow[] } | SheetRow[]>(SHEETS_URL);
    // Handle both { data: [...] } and bare array responses
    const rows: SheetRow[] = Array.isArray(res.data)
      ? res.data
      : (res.data as { data: SheetRow[] }).data ?? [];
    return rows.map(normaliseSheetRow);
  } catch {
    return [];
  }
}

/**
 * Fetch rows filtered by date range (ISO strings).
 * Filtering is done client-side since Apps Script Web Apps don’t support query params by default.
 */
export async function fetchSheetByDateRange(from: Date, to: Date): Promise<SheetRow[]> {
  const rows = await fetchFromSheet();
  return rows.filter((r) => {
    const t = new Date(r.timestamp ?? 0).getTime();
    return t >= from.getTime() && t <= to.getTime();
  });
}
