import GradeBadge from "@/components/GradeBadge";
import { int, pct } from "@/lib/format";

// 등급 띠: S · A · B · C 곳 수만큼 칸을 나눈 한 줄 막대 + 아래에 글자(색만으로 말하지 않는다).
// 좁은 칸(몇 곳뿐인 등급)은 막대 안에 글자가 들어가지 않으므로 아래 줄을 언제나 함께 보인다.
export const GRADE_BG: Record<string, string> = {
  S: "bg-grade-s",
  A: "bg-grade-a",
  B: "bg-grade-b",
  C: "bg-grade-c",
};

export default function GradeStrip({ counts }: { counts: { grade: string; count: number; share: number | null }[] }) {
  return (
    <div className="space-y-2">
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-sm" aria-hidden="true">
        {counts.map((c) =>
          c.count > 0 && c.share !== null ? (
            <span
              key={c.grade}
              className={`block h-4 ${GRADE_BG[c.grade] ?? "bg-line"}`}
              style={{ width: `${c.share * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
        {counts.map((c) => (
          <li key={c.grade} className="flex items-center gap-1.5">
            <GradeBadge grade={c.grade} />
            <span className="num">
              {int(c.count)}곳 {pct(c.share)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
