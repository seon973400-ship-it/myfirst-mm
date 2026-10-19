import raw from "@/data/buyers.json";

// 바이어 데이터 — 지금은 data/buyers.json을 그대로 돌려준다.
// 5일차에 DB로 바꿀 때는 아래 두 함수의 속만 바꾼다(그래서 async로 둔다).
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

const buyers = raw as Buyer[];

export async function getBuyers(): Promise<Buyer[]> {
  return buyers;
}

/** id는 대문자로 맞춰 찾는다(b048 → B048). 없으면 null. */
export async function getBuyer(id: string): Promise<Buyer | null> {
  const key = id.toUpperCase();
  return buyers.find((b) => b.id === key) ?? null;
}
