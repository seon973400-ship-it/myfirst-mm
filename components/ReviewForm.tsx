"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { addReview } from "@/app/buyers/[id]/actions";
import Notice from "@/components/Notice";

// 확인 기록 입력 칸: 입력 · 보내기만 맡는다. 검사 · 저장은 서버 액션(addReview)이 한다.
// <form action>으로 보내면 React가 폼을 처음 값으로 되돌리므로, onSubmit에서 직접 보낸다(상태 · 별명이 남게).
export type ReviewState = { ok: boolean; message: string };

const STATUSES = ["확인 필요", "확인 완료", "보류"];
const MEMO_MAX = 200;

// 말로 적기: 브라우저 내장 음성 인식(Chrome · Edge는 webkit 접두어). TypeScript 기본 형에 없어 필요한 만큼만 적는다.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function ReviewForm({ buyerId }: { buyerId: string }) {
  const [state, formAction, pending] = useActionState(addReview, { ok: false, message: "" });
  const [memo, setMemo] = useState("");
  const [micSupported, setMicSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState("");
  const recRef = useRef<Recognition | null>(null);

  // 저장되면 메모 칸만 비운다
  useEffect(() => {
    if (state.ok) setMemo("");
  }, [state]);

  // 음성 인식이 되는 브라우저인지만 본다(마이크는 단추를 눌렀을 때만 켠다). 쪽을 떠나면 끈다.
  useEffect(() => {
    setMicSupported(recognitionCtor() !== null);
    return () => recRef.current?.abort();
  }, []);

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setMicSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.interimResults = false;
    rec.continuous = false;
    // 들은 말은 메모 칸 끝에만 붙인다(저장은 '기록 남기기'를 눌렀을 때만)
    rec.onresult = (e) => {
      let heard = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) heard += e.results[i][0].transcript;
      }
      heard = heard.trim();
      if (heard) setMemo((m) => (m.trim() ? `${m.trimEnd()} ${heard}` : heard));
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      setMicNote(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "마이크 권한이 꺼져 있습니다 — 주소창 왼쪽에서 마이크를 허용해 주세요"
          : "말을 알아듣지 못했습니다 — 다시 눌러 주세요",
      );
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setMicNote("");
    try {
      rec.start();
      setListening(true);
    } catch {
      setMicNote("말을 알아듣지 못했습니다 — 다시 눌러 주세요");
    }
  }

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
        {micSupported === false ? (
          <p className="text-sm text-muted">이 브라우저는 음성 인식을 지원하지 않습니다 — Chrome · Edge에서 열어 주세요</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleMic}
              disabled={micSupported === null}
              aria-pressed={listening}
              className={`inline-flex min-h-11 items-center rounded-md border px-4 font-semibold disabled:opacity-60 ${
                listening ? "border-warn text-warn" : "border-accent text-accent"
              }`}
            >
              {listening ? "멈추기" : "말로 적기"}
            </button>
            <p aria-live="polite" className="text-sm text-muted">
              {listening ? "듣는 중입니다 — 말한 뒤 잠시 기다리면 메모 칸에 적힙니다" : micNote}
            </p>
          </div>
        )}
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
