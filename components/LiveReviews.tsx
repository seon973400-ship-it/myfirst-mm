"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Notice from "@/components/Notice";

// 저절로 바뀌는 팀 화면: 10초마다 서버에서 쪽을 다시 읽고(router.refresh), 가장 새 기록 번호가 커지면 알린다.
// 값(번호 · 요약 · 확인 시각)은 서버가 만들어 props로 준다. 소리 · 알림은 사람이 단추를 눌렀을 때만 켠다.
const EVERY_MS = 10_000;

export default function LiveReviews({
  latestId,
  latestText,
  checkedAt,
}: {
  latestId: number | null;
  latestText: string;
  checkedAt: string;
}) {
  const router = useRouter();
  const prevId = useRef(latestId);
  const audio = useRef<AudioContext | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [notifyOn, setNotifyOn] = useState(false);
  const [note, setNote] = useState("");
  const [arrived, setArrived] = useState("");

  // 다른 탭을 보는 동안은 쉰다
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, EVERY_MS);
    return () => clearInterval(t);
  }, [router]);

  // 새 기록이 들어왔는지(번호가 커졌는지) 본다
  useEffect(() => {
    const prev = prevId.current;
    prevId.current = latestId;
    if (latestId === null || (prev !== null && latestId <= prev)) return;

    setArrived(latestText);
    if (soundOn && audio.current) ding(audio.current);
    if (notifyOn) {
      try {
        new Notification("새 확인 기록", { body: latestText });
      } catch {
        // Android Chrome 등은 여기서 실패한다 — 화면 안 알림(위 arrived)으로 충분
      }
    }
  }, [latestId, latestText, soundOn, notifyOn]);

  function toggleSound() {
    if (soundOn) {
      setSoundOn(false);
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      setNote("이 브라우저는 알림음을 지원하지 않습니다 — 새 기록은 화면 안에 알려 드립니다");
      return;
    }
    audio.current ??= new Ctx();
    void audio.current.resume();
    ding(audio.current); // 켜졌다는 걸 들려준다
    setSoundOn(true);
  }

  async function toggleNotify() {
    if (notifyOn) {
      setNotifyOn(false);
      return;
    }
    if (!("Notification" in window)) {
      setNote("이 브라우저는 알림 창을 지원하지 않습니다(PC 전용) — 새 기록은 화면 안에 알려 드립니다");
      return;
    }
    const p = await Notification.requestPermission();
    if (p === "granted") {
      setNotifyOn(true);
      setNote("");
    } else {
      setNote("알림이 꺼져 있습니다 — 주소창 왼쪽에서 알림을 허용해 주세요. 새 기록은 화면 안에 알려 드립니다");
    }
  }

  const btn = (on: boolean) =>
    `inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold ${
      on ? "border-accent bg-accent text-white" : "border-line text-ink hover:bg-surface"
    }`;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">
        10초마다 저절로 새로 고침 · 마지막 확인 <span className="num">{checkedAt}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={toggleSound} aria-pressed={soundOn} className={btn(soundOn)}>
          {soundOn ? "알림음 끄기" : "알림음 켜기"}
        </button>
        <button type="button" onClick={toggleNotify} aria-pressed={notifyOn} className={btn(notifyOn)}>
          {notifyOn ? "PC 알림 끄기" : "PC 알림 켜기"}
        </button>
      </div>
      {note ? <p className="text-sm text-muted">{note}</p> : null}
      {arrived ? (
        <Notice tone="info" title="새 확인 기록이 들어왔습니다">
          {arrived}
        </Notice>
      ) : null}
    </div>
  );
}

/** 짧은 '띵' — 브라우저 내장 소리(Web Audio), 파일 없음 */
function ding(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.setValueAtTime(1320, t + 0.12);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.5);
}
