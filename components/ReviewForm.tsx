"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { addReview } from "@/app/buyers/[id]/actions";
import Notice from "@/components/Notice";

// 확인 기록 입력 칸: 입력 · 보내기만 맡는다. 검사 · 저장은 서버 액션(addReview)이 한다.
// <form action>으로 보내면 React가 폼을 처음 값으로 되돌리므로, onSubmit에서 직접 보낸다(상태 · 별명이 남게).
export type ReviewState = { ok: boolean; message: string };

const STATUSES = ["확인 필요", "확인 완료", "보류"];
const MEMO_MAX = 200;

export default function ReviewForm({ buyerId }: { buyerId: string }) {
  const [state, formAction, pending] = useActionState(addReview, { ok: false, message: "" });
  const [memo, setMemo] = useState("");

  // 저장되면 메모 칸만 비운다
  useEffect(() => {
    if (state.ok) setMemo("");
  }, [state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  const over = memo.length > MEMO_MAX;

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-4">
      <input type="hidden" name="buyerId" value={buyerId} />

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">상태</legend>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <label
              key={s}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line bg-bg px-3 text-ink has-[:checked]:border-accent"
            >
              <input type="radio" name="status" value={s} defaultChecked={s === STATUSES[0]} />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1">
        <label htmlFor="review-memo" className="text-sm text-muted">
          메모
        </label>
        <textarea
          id="review-memo"
          name="memo"
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 다음 주 입금 약속 — 전화로 확인"
          className="block w-full rounded-md border border-line bg-bg p-3 text-ink"
        />
        <p className={`num text-right text-sm ${over ? "font-semibold text-warn" : "text-muted"}`}>
          {memo.length}/{MEMO_MAX}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="review-reviewer" className="text-sm text-muted">
          확인한 사람(별명)
        </label>
        <input
          id="review-reviewer"
          name="reviewer"
          placeholder="실명 대신 별명"
          className="block min-h-11 w-full rounded-md border border-line bg-bg px-3 text-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "저장 중…" : "기록 남기기"}
      </button>

      {state.message ? <Notice tone={state.ok ? "ok" : "warn"} title={state.message} /> : null}
    </form>
  );
}
