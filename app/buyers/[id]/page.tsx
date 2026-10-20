import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import GradeBadge from "@/components/GradeBadge";
import PageHeader from "@/components/PageHeader";
import ReviewForm from "@/components/ReviewForm";
import RiskMeter from "@/components/RiskMeter";
import SpeakButton from "@/components/SpeakButton";
import { getBuyer, getBuyers } from "@/lib/buyers";
import { int, kst, pct, usd } from "@/lib/format";
import { riskRank } from "@/lib/metrics";
import { getReviews, REVIEW_STATUS_CLASS } from "@/lib/reviews";

export const dynamic = "force-dynamic";

// 바이어 상세 — 요청 때마다 DB에서 읽어 만든다(generateStaticParams 없음).
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const buyer = await getBuyer(id);
  return { title: buyer ? `${buyer.id} · ${buyer.name}` : "바이어를 찾을 수 없습니다" };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const buyer = await getBuyer(id);
  if (!buyer) notFound();
  const reviews = await getReviews(buyer.id);
  // 순위는 전체와 견줘야 하므로 전체를 읽어 riskRank(topRisk와 같은 정렬)로 센다
  const all = await getBuyers();
  const rank = riskRank(all, buyer.id);

  // 읽어 주기 문장 — 화면과 같은 값 · 같은 형식(int · pct)으로 서버에서 만든다
  const latest = reviews[0];
  const speech = [
    `${buyer.id} ${buyer.name}.`,
    `등급 ${buyer.grade}.`,
    `채권 ${int(buyer.openArUsd)}달러, 연체 ${int(buyer.overdueUsd)}달러, 위험 점수 ${pct(buyer.pd30d)}.`,
    latest ? `최근 기록: ${latest.status}, ${latest.memo}` : "아직 확인 기록이 없습니다.",
  ].join(" ");

  const facts: { label: string; value: ReactNode; num?: boolean }[] = [
    { label: "나라", value: buyer.countryKo },
    { label: "지역", value: buyer.region },
    { label: "업종", value: buyer.industry },
    { label: "결제방식", value: buyer.paymentMethod },
    { label: "결제기간", value: `${int(buyer.termsDays)}일`, num: true },
    { label: "채권", value: usd(buyer.openArUsd), num: true },
    { label: "연체", value: usd(buyer.overdueUsd), num: true },
    { label: "31일 넘긴 채권 비중", value: pct(buyer.pctAr31p), num: true },
    { label: "가장 오래 밀린 인보이스", value: `${int(buyer.oldestOpenDays)}일`, num: true },
    {
      label: "최근 1년 평균 지연",
      value: buyer.avgDaysLate12m === null ? "—" : `${buyer.avgDaysLate12m.toFixed(1)}일`,
      num: true,
    },
    { label: "위험 점수", value: pct(buyer.pd30d), num: true },
    { label: "등급", value: <GradeBadge grade={buyer.grade} /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={buyer.name}
        asof="2026-09-30 · (가상) 합성 데이터"
        line={`${buyer.id} · ${buyer.countryKo} · ${buyer.region}`}
      />

      <SpeakButton text={speech} />

      <RiskMeter grade={buyer.grade} score={buyer.pd30d} rank={rank} total={all.length} />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {facts.map((f) => (
          <div key={f.label} className="rounded-lg border border-line bg-surface p-3">
            <dt className="text-sm text-muted">{f.label}</dt>
            <dd className={`mt-1 font-semibold text-ink ${f.num ? "num" : ""}`}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="signals" className="space-y-3">
        <h2 id="signals" className="text-lg font-semibold text-ink">
          위험 신호
        </h2>
        {buyer.signals.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-ink">
            {buyer.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">표시된 신호가 없습니다.</p>
        )}
        <p className="text-sm text-muted">이 신호들은 확인해 볼 이유이지, 연체의 원인이라는 뜻은 아닙니다.</p>
      </section>

      <section aria-labelledby="reviews" className="space-y-3">
        <h2 id="reviews" className="text-lg font-semibold text-ink">
          확인 기록
        </h2>
        <ReviewForm buyerId={buyer.id} />
        {reviews.length > 0 ? (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="space-y-1 rounded-lg border border-line p-3">
                <span
                  className={`inline-flex items-center rounded border px-1.5 text-sm font-semibold ${
                    REVIEW_STATUS_CLASS[r.status] ?? "border-line text-muted"
                  }`}
                >
                  {r.status}
                </span>
                <p className="whitespace-pre-wrap break-words text-ink">{r.memo}</p>
                <p className="text-sm text-muted">
                  {r.reviewer} · <span className="num">{kst(r.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">아직 확인 기록이 없습니다</p>
        )}
      </section>

      <Link href="/buyers" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-accent">
        바이어 목록으로
      </Link>
    </div>
  );
}
