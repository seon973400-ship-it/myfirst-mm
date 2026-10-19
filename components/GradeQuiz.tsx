"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GradeBadge from "@/components/GradeBadge";

// 등급 맞히기: 문제는 서버에서 골라 props로 받는다(형식을 맞춘 글자만). 이 부품은 누르기 · 점수만 맡는다.
export type QuizQuestion = {
  id: string;
  name: string;
  grade: string;
  facts: { label: string; value: string; num?: boolean }[];
};

const CHOICES = ["S", "A", "B", "C"];

export default function GradeQuiz({ questions }: { questions: QuizQuestion[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const total = questions.length;
  const done = index >= total;

  if (total === 0) {
    return <p className="rounded-lg border border-line bg-surface p-4 text-muted">문제를 만들 바이어가 없습니다.</p>;
  }

  if (done) {
    return (
      <section aria-label="결과" className="space-y-4 rounded-lg border border-line bg-surface p-4">
        <p className="text-sm text-muted">결과</p>
        <p className="num text-3xl font-bold text-ink">
          {score} / {total}
        </p>
        <p className="text-ink">
          {score === total
            ? "모두 맞혔습니다."
            : `${total - score}문제는 데이터의 등급과 달랐습니다.`}
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-white"
        >
          새 문제로 다시
        </button>
      </section>
    );
  }

  const q = questions[index];
  const correct = picked !== null && picked === q.grade;

  function choose(g: string) {
    if (picked !== null) return;
    setPicked(g);
    if (g === q.grade) setScore((s) => s + 1);
  }

  function next() {
    setPicked(null);
    setIndex((i) => i + 1);
  }

  return (
    <section aria-label={`문제 ${index + 1}`} className="space-y-4">
      <p className="text-sm text-muted">
        문제 <span className="num">{index + 1} / {total}</span> · 지금 점수 <span className="num">{score}</span>
      </p>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {q.facts.map((f) => (
          <div key={f.label} className="rounded-lg border border-line bg-surface p-3">
            <dt className="text-sm text-muted">{f.label}</dt>
            <dd className={`mt-1 font-semibold text-ink ${f.num ? "num" : ""}`}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-2 text-ink">이 바이어의 등급은?</p>
        <div className="grid grid-cols-4 gap-2">
          {CHOICES.map((g) => {
            const isPicked = picked === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => choose(g)}
                disabled={picked !== null}
                aria-pressed={isPicked}
                className={`min-h-11 rounded-md border text-lg font-semibold ${
                  isPicked ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"
                } disabled:cursor-default`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {picked !== null ? (
        <div role="status" className="space-y-3 rounded-lg border border-line bg-surface p-4">
          <p className={`font-semibold ${correct ? "text-accent" : "text-warn"}`}>
            {correct ? "맞았습니다." : `아쉽습니다. ${picked}등급을 고르셨습니다.`}
          </p>
          <p className="flex flex-wrap items-center gap-2 text-ink">
            정답 <GradeBadge grade={q.grade} />
            <Link href={`/buyers/${q.id}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
              {q.name} ({q.id})
            </Link>
          </p>
          <button
            type="button"
            onClick={next}
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-white"
          >
            {index + 1 < total ? "다음 문제" : "결과 보기"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
