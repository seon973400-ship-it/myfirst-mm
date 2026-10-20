import "dotenv/config";
import buyers from "../data/buyers.json";
import { db } from "../lib/db";

// 처음 데이터 — data/buyers.json의 바이어를 Buyer 표에 넣는다(npm run db:seed).
// skipDuplicates라서 두 번 돌려도 이미 있는 id는 건너뛴다 → 행 수는 JSON 줄 수 그대로.

const GRADES = ["S", "A", "B", "C"] as const;

async function main() {
  // JSON의 16키를 같은 이름의 칸으로 — null · 배열 · 숫자는 그대로
  const data = buyers.map((b) => ({
    id: b.id,
    name: b.name,
    countryCode: b.countryCode,
    countryKo: b.countryKo,
    region: b.region,
    industry: b.industry,
    paymentMethod: b.paymentMethod,
    termsDays: b.termsDays,
    openArUsd: b.openArUsd,
    overdueUsd: b.overdueUsd,
    pctAr31p: b.pctAr31p,
    oldestOpenDays: b.oldestOpenDays,
    avgDaysLate12m: b.avgDaysLate12m,
    pd30d: b.pd30d,
    grade: b.grade,
    signals: b.signals,
  }));

  const { count } = await db().buyer.createMany({ data, skipDuplicates: true });

  // 넣은 뒤 DB에서 다시 센다
  const total = await db().buyer.count();
  const groups = await db().buyer.groupBy({ by: ["grade"], _count: { _all: true } });
  const reviews = await db().review.count();
  const byGrade = new Map(groups.map((g) => [g.grade, g._count._all]));
  const gradeLine = GRADES.map((g) => `${g} ${byGrade.get(g) ?? 0}`).join(" · ");

  console.log(`새로 넣음 ${count}행 · 이미 있던 행 ${buyers.length - count}행`);
  console.log(`Buyer ${total}행 (${gradeLine})`);
  console.log(`Review ${reviews}행`);
}

try {
  await main();
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
} finally {
  await db().$disconnect();
}
