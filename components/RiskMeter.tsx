import GradeBadge from "@/components/GradeBadge";
import { GRADE_BG } from "@/components/GradeStrip";
import { int, pct } from "@/lib/format";

// 위험 점수 막대(0–100%, 그 바이어의 등급 색) + 글자 값 + '높은 순 N위 / 전체'. 순위는 lib/metrics의 riskRank로 받는다.
export default function RiskMeter({
  grade,
  score,
  rank,
  total,
}: {
  grade: string;
  score: number;
  rank: number | null;
  total: number;
}) {
  const width = Math.max(0, Math.min(100, score * 100));
  return (
    <section aria-label="위험 점수" className="space-y-2 rounded-lg border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">위험 점수(30일 안 연체 확률)</p>
        <p className="num text-2xl font-bold text-ink">{pct(score)}</p>
      </div>
      <div className="h-3 rounded-sm border border-line bg-bg" aria-hidden="true">
        <span className={`block h-full rounded-sm ${GRADE_BG[grade] ?? "bg-muted"}`} style={{ width: `${width}%` }} />
      </div>
      <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
        <span>
          위험 점수 높은 순{" "}
          <span className="num font-semibold">
            {rank === null ? "확인 필요" : `${int(rank)}위`} / {int(total)}곳
          </span>
        </span>
        <GradeBadge grade={grade} />
      </p>
    </section>
  );
}
