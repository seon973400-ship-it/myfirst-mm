import type { Metadata } from "next";
import { connection } from "next/server";
import GradeQuiz, { type QuizQuestion } from "@/components/GradeQuiz";
import PageHeader from "@/components/PageHeader";
import { getBuyers } from "@/lib/buyers";
import { int, usd } from "@/lib/format";
import { GRADES, QUIZ_MIX, quizSet } from "@/lib/metrics";

export const metadata: Metadata = { title: "등급 맞히기" };

// 문제는 요청 때마다 서버에서 새로 고른다(빌드 때 고정되지 않게 connection()).
// 브라우저에는 10곳의 필요한 칸만, 형식을 맞춘 글자로 보낸다. 위험 점수 · 신호는 보내지 않는다.
export default async function Page() {
  await connection();
  const buyers = await getBuyers();
  const questions: QuizQuestion[] = quizSet(buyers).map((b) => ({
    id: b.id,
    name: b.name,
    grade: b.grade,
    facts: [
      { label: "나라", value: b.countryKo },
      { label: "업종", value: b.industry },
      { label: "결제방식", value: b.paymentMethod },
      { label: "결제기간", value: `${int(b.termsDays)}일`, num: true },
      { label: "채권", value: usd(b.openArUsd), num: true },
      { label: "연체", value: usd(b.overdueUsd), num: true },
      {
        label: "최근 1년 평균 지연",
        value: b.avgDaysLate12m === null ? "—" : `${b.avgDaysLate12m.toFixed(1)}일`,
        num: true,
      },
    ],
  }));
  const mix = GRADES.map((g) => `${g} ${QUIZ_MIX[g]}`).join(" · ");

  return (
    <div className="space-y-6">
      <PageHeader
        title="등급 맞히기"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="바이어 정보만 보고 등급을 골라 보세요. 정답은 데이터의 등급 칸 그대로입니다."
      />
      <p className="text-sm text-muted">
        문제는 등급별로 <span className="num">{mix}</span>곳을 골라 섞었습니다. 쪽을 열 때마다 바뀝니다.
      </p>
      <GradeQuiz key={questions.map((q) => q.id).join("-")} questions={questions} />
    </div>
  );
}
