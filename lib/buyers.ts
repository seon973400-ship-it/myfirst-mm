import { db } from "@/lib/db";

// 바이어 데이터 — 금고(Supabase DB)의 Buyer 표에서 읽는다(서버에서만).
// 처음 데이터는 prisma/seed.ts가 data/buyers.json에서 넣었다.
export type Buyer = {
  id: string;
  name: string;
  countryCode: string;
  countryKo: string;
  region: string;
  industry: string;
  paymentMethod: string;
  termsDays: number;
  openArUsd: number;
  overdueUsd: number;
  /** 31일 넘긴 채권 비중(0–1), 없으면 null */
  pctAr31p: number | null;
  oldestOpenDays: number;
  /** 최근 1년 평균 지연 일수, 없으면 null */
  avgDaysLate12m: number | null;
  /** 30일 안 연체 확률(0–1) */
  pd30d: number;
  grade: "S" | "A" | "B" | "C";
  signals: string[];
};

// DB의 grade 칸은 string이라 등급 형(S · A · B · C)으로 맞춰 돌려준다 — 값은 JSON에서 넣은 그대로.
export async function getBuyers(): Promise<Buyer[]> {
  const rows = await db().buyer.findMany({ orderBy: { id: "asc" } });
  return rows as Buyer[];
}

/** id는 대문자로 맞춰 찾는다(b048 → B048). 없으면 null. */
export async function getBuyer(id: string): Promise<Buyer | null> {
  const row = await db().buyer.findUnique({ where: { id: id.toUpperCase() } });
  return row as Buyer | null;
}
