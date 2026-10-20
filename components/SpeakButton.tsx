"use client";

import { useEffect, useState } from "react";

// 읽어 주기: 서버가 만든 문장(text)을 브라우저 내장 음성(speechSynthesis)으로 읽는다. 키 없음 · 아무 데도 보내지 않음.
// 단추를 눌렀을 때만 읽고, 읽는 동안 다시 누르면 멈춘다. 안 되는 브라우저는 한 줄 안내만.
export default function SpeakButton({ text }: { text: string }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const ok = "speechSynthesis" in window;
    setSupported(ok);
    // 쪽을 떠나면 읽던 것을 멈춘다
    return () => {
      if (ok) window.speechSynthesis.cancel();
    };
  }, []);

  function toggle() {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }

  if (supported === false) {
    return <p className="text-sm text-muted">이 브라우저는 읽어 주기를 지원하지 않습니다 — Chrome · Edge에서 열어 주세요</p>;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={supported === null}
      aria-pressed={speaking}
      className="inline-flex min-h-11 items-center rounded-md border border-accent px-4 font-semibold text-accent disabled:opacity-60"
    >
      {speaking ? "멈추기" : "읽어 주기"}
    </button>
  );
}
