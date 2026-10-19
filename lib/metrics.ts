import type { Buyer } from "@/lib/buyers";

// 바이어 숫자 계산 — 순수 함수만(화면 글자는 만들지 않는다. 형식은 lib/format.ts).
// 등급은 데이터의 grade 칸 그대로 쓴다 — pd30d로 다시 매기지 않는다.

export type Grade = Buyer["grade"];
export const GRADES: Grade[] = ["S", "A", "B", "C"];

export function isGrade(v: unknown): v is Grade {
  return typeof v === "string" && (GRADES as string[]).includes(v);
}

function sumAr(list: Buyer[]): number {
  return list.reduce((sum, b) => sum + b.openArUsd, 0);
}

function ratio(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

/** pd30d 큰 순, 같으면 id 순 */
function byRisk(a: Buyer, b: Buyer): number {
  if (b.pd30d !== a.pd30d) return b.pd30d - a.pd30d;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function kpis(buyers: Buyer[]) {
  const gradeC = buyers.filter((b) => b.grade === "C");
  const arAll = sumAr(buyers);
  const arC = sumAr(gradeC);
  return {
    cCount: gradeC.length,
    arC,
    cShare: ratio(arC, arAll),
    arAll,
    total: buyers.length,
    overdue: buyers.reduce((sum, b) => sum + b.overdueUsd, 0),
    overdueCount: buyers.filter((b) => b.overdueUsd > 0).length,
  };
}

/** S · A · B · C 곳 수(이 순서) */
export function gradeCounts(buyers: Buyer[]): { grade: Grade; count: number }[] {
  return GRADES.map((grade) => ({ grade, count: buyers.filter((b) => b.grade === grade).length }));
}

export function topRisk(buyers: Buyer[], n = 10): Buyer[] {
  return [...buyers].sort(byRisk).slice(0, n);
}

/** 지역마다 곳 수 · 채권 합 · C등급 채권 합 · C 몫(그 지역 안에서), 합이 큰 순 */
export function byRegion(buyers: Buyer[]) {
  const groups = new Map<string, Buyer[]>();
  for (const b of buyers) {
    const list = groups.get(b.region) ?? [];
    list.push(b);
    groups.set(b.region, list);
  }
  return [...groups.entries()]
    .map(([region, list]) => {
      const arUsd = sumAr(list);
      const arCUsd = sumAr(list.filter((b) => b.grade === "C"));
      return { region, count: list.length, arUsd, arCUsd, cShare: ratio(arCUsd, arUsd) };
    })
    .sort((a, b) => b.arUsd - a.arUsd || (a.region < b.region ? -1 : 1));
}

/** grade가 S · A · B · C면 그 등급만, 아니면 전부. 순서는 topRisk와 같다. */
export function filterByGrade(buyers: Buyer[], grade: unknown): Buyer[] {
  const list = isGrade(grade) ? buyers.filter((b) => b.grade === grade) : buyers;
  return [...list].sort(byRisk);
}

/** 등급 맞히기 문제 수 — 그냥 무작위면 거의 S만 나오므로 등급별로 나눠 고른다. */
export const QUIZ_MIX: Record<Grade, number> = { S: 4, A: 2, B: 2, C: 2 };

function shuffle<T>(list: T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 등급마다 QUIZ_MIX만큼 골라 섞는다(그 등급이 모자라면 있는 만큼). rand를 넣으면 같은 결과를 다시 만들 수 있다. */
export function quizSet(buyers: Buyer[], rand: () => number = Math.random): Buyer[] {
  const picked = GRADES.flatMap((g) => shuffle(buyers.filter((b) => b.grade === g), rand).slice(0, QUIZ_MIX[g]));
  return shuffle(picked, rand);
}
