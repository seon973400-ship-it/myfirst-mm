import { db } from "@/lib/db";

// 확인 기록 읽기 — 서버에서만(서버 컴포넌트). 쓰기는 app/buyers/[id]/actions.ts.
// 최신이 위: createdAt 내림차순, 같은 시각이면 id 내림차순.

const NEWEST_FIRST = [{ createdAt: "desc" as const }, { id: "desc" as const }];

/** 상태 배지 색(글자와 함께 쓴다 — 색만으로 말하지 않는다). 모르는 상태는 회색. */
export const REVIEW_STATUS_CLASS: Record<string, string> = {
  "확인 필요": "border-warn text-warn",
  "확인 완료": "border-accent text-accent",
  보류: "border-muted text-muted",
};

/** 그 바이어의 기록 */
export async function getReviews(buyerId: string, take = 20) {
  return db().review.findMany({ where: { buyerId }, orderBy: NEWEST_FIRST, take });
}

/** 모든 바이어의 최신 기록 + 바이어 이름 */
export async function getRecentReviews(take = 5) {
  return db().review.findMany({
    orderBy: NEWEST_FIRST,
    take,
    include: { buyer: { select: { name: true } } },
  });
}
