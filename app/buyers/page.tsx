import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import BarRow from "@/components/BarRow";
import DataTable, { type Column } from "@/components/DataTable";
import GradeBadge from "@/components/GradeBadge";
import GradeStrip from "@/components/GradeStrip";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import { getBuyers, type Buyer } from "@/lib/buyers";
import { int, pct, usd } from "@/lib/format";
import { byRegion, filterByGrade, gradeCounts, isGrade, kpis, searchBuyers, topRisk } from "@/lib/metrics";

// 전체 목록은 처음 이만큼만 보이고, '모두 보기'로 펼친다(휴대폰에서 카드 150장 스크롤을 줄이려고).
const FIRST_ROWS = 20;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// 전체 목록 주소 — 등급 · 찾는 말 · 펼침을 함께 담고, 누르면 목록 위치로 간다.
function listHref({ grade, q, all }: { grade: string | null; q: string; all?: boolean }): string {
  const sp = new URLSearchParams();
  if (grade) sp.set("grade", grade);
  if (q) sp.set("q", q);
  if (all) sp.set("show", "all");
  const qs = sp.toString();
  return `/buyers${qs ? `?${qs}` : ""}#all-list`;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "바이어" };

// 바이어 이름 칸: 상세 쪽 링크 + 아래에 작게 id. 첫 열이라 휴대폰 카드의 제목이 된다.
function BuyerCell({ buyer, rank }: { buyer: Buyer; rank?: number }) {
  return (
    <div>
      <Link href={`/buyers/${buyer.id}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
        {rank ? `${rank}. ${buyer.name}` : buyer.name}
      </Link>
      <div className="num text-xs font-normal text-muted">{buyer.id}</div>
    </div>
  );
}

function buyerRow(b: Buyer, rank?: number) {
  return {
    buyer: <BuyerCell buyer={b} rank={rank} />,
    country: b.countryKo,
    grade: <GradeBadge grade={b.grade} />,
    risk: pct(b.pd30d),
    ar: usd(b.openArUsd),
    overdue: usd(b.overdueUsd),
  };
}

const BASE_COLUMNS: Column[] = [
  { key: "buyer", label: "바이어" },
  { key: "country", label: "나라" },
  { key: "grade", label: "등급" },
  { key: "risk", label: "위험 점수", align: "right" },
  { key: "ar", label: "채권", align: "right" },
  { key: "overdue", label: "연체", align: "right" },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string | string[]; q?: string | string[]; show?: string | string[] }>;
}) {
  const sp = await searchParams;
  const picked = first(sp.grade);
  const grade = isGrade(picked) ? picked : null;
  const q = (first(sp.q) ?? "").trim();
  const showAll = first(sp.show) === "all";

  // KPI · 위험 상위 10 · 지역별은 언제나 전체 기준 — 등급 칩은 전체 목록만 거른다.
  const buyers = await getBuyers();
  const k = kpis(buyers);
  const counts = gradeCounts(buyers);
  const top = topRisk(buyers, 10);
  const regions = byRegion(buyers);
  const maxRegionAr = Math.max(0, ...regions.map((r) => r.arUsd));
  const strongRegion = regions.reduce<(typeof regions)[number] | null>(
    (best, r) => (r.cShare !== null && (best === null || r.cShare > (best.cShare ?? -1)) ? r : best),
    null,
  );
  const list = searchBuyers(filterByGrade(buyers, grade), q);
  const visible = showAll ? list : list.slice(0, FIRST_ROWS);
  const hidden = list.length - visible.length;

  // 칩 곳 수는 등급 전체 기준(찾는 말과 상관없이) — 칩을 눌러도 찾는 말은 남는다.
  const chips = [
    { key: "all", label: "전체", count: k.total, href: listHref({ grade: null, q }), active: grade === null },
    ...counts.map((c) => ({
      key: c.grade,
      label: c.grade,
      count: c.count,
      href: listHref({ grade: c.grade, q }),
      active: grade === c.grade,
    })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`바이어 ${int(k.total)}곳`}
        asof="2026-09-30 · (가상) 합성 데이터"
        line="위험 점수는 판단을 돕는 값이고, 결정은 사람이 합니다."
      />

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="위험 바이어(C등급)" value={`${int(k.cCount)}곳`} />
        <KpiCard label="C등급 채권" value={usd(k.arC)} sub={`전체의 ${pct(k.cShare)}`} />
        <KpiCard label="전체 채권" value={usd(k.arAll)} sub={`${int(k.total)}곳`} />
        <KpiCard label="연체 금액" value={usd(k.overdue)} sub={`${int(k.overdueCount)}곳`} />
      </section>

      <section aria-labelledby="grade-mix" className="space-y-3">
        <h2 id="grade-mix" className="text-lg font-semibold text-ink">
          등급 분포
        </h2>
        <GradeStrip counts={counts} />
      </section>

      <section aria-labelledby="top-risk" className="space-y-3">
        <h2 id="top-risk" className="text-lg font-semibold text-ink">
          위험 상위 10
        </h2>
        <DataTable
          caption="위험 점수(30일 안 연체 확률) 큰 순"
          columns={[...BASE_COLUMNS, { key: "signal", label: "첫 신호" }]}
          rows={top.map((b, i) => ({ ...buyerRow(b, i + 1), signal: b.signals[0] ?? "—" }))}
        />
      </section>

      <section aria-labelledby="by-region" className="space-y-3">
        <h2 id="by-region" className="text-lg font-semibold text-ink">
          지역별 채권
        </h2>
        <ul className="space-y-2">
          {regions.map((r) => (
            <li key={r.region}>
              <BarRow
                label={r.region}
                value={r.arUsd}
                max={maxRegionAr}
                display={usd(r.arUsd)}
                strong={r.region === strongRegion?.region}
              />
              <p className="text-xs text-muted">
                C등급 <span className="num">{usd(r.arCUsd)}</span> · <span className="num">{pct(r.cShare)}</span>
              </p>
            </li>
          ))}
        </ul>
        {strongRegion ? (
          <p className="text-sm text-muted">진하게 표시한 줄은 지역 채권 중 C등급 몫이 가장 큰 지역입니다.</p>
        ) : null}
      </section>

      <section aria-labelledby="all-list" className="space-y-3">
        <h2 id="all-list" className="scroll-mt-4 text-lg font-semibold text-ink">
          전체 목록
        </h2>
        <Form action="/buyers" role="search" className="flex gap-2">
          <label htmlFor="buyer-q" className="sr-only">
            바이어 찾기
          </label>
          <input
            id="buyer-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="번호 · 이름 · 나라로 찾기 (예: B048, 중국)"
            className="min-h-11 min-w-0 flex-1 rounded-md border border-line bg-bg px-3 text-base text-ink placeholder:text-muted"
          />
          {grade ? <input type="hidden" name="grade" value={grade} /> : null}
          <button type="submit" className="min-h-11 shrink-0 rounded-md bg-accent px-4 text-white">
            찾기
          </button>
        </Form>
        {q ? (
          <Link
            href={listHref({ grade, q: "" })}
            className="inline-flex min-h-11 items-center text-sm text-accent hover:underline"
          >
            찾기 지우기
          </Link>
        ) : null}
        <nav aria-label="등급으로 거르기">
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c.key}>
                <Link
                  href={c.href}
                  aria-current={c.active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm ${
                    c.active ? "border-accent bg-accent text-white" : "border-line text-ink hover:bg-surface"
                  }`}
                >
                  {c.label}&nbsp;<span className="num">{int(c.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-muted">
          {grade ? `${grade}등급 ` : "전체 "}
          {q ? `· '${q}' ` : ""}
          <span className="num">{int(list.length)}곳</span>
          {hidden > 0 ? (
            <>
              {" "}
              중 <span className="num">{int(visible.length)}곳</span> 보는 중
            </>
          ) : null}
        </p>
        <DataTable
          columns={BASE_COLUMNS}
          rows={visible.map((b) => buyerRow(b))}
          empty={q ? `'${q}'에 맞는 바이어가 없습니다.` : undefined}
        />
        {hidden > 0 ? (
          <Link
            href={listHref({ grade, q, all: true })}
            className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-accent"
          >
            나머지 <span className="num">&nbsp;{int(hidden)}곳&nbsp;</span> 모두 보기
          </Link>
        ) : null}
      </section>
    </div>
  );
}
