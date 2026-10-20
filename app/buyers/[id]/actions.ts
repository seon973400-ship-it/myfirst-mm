"use server";

import { revalidatePath } from "next/cache";
import type { ReviewState } from "@/components/ReviewForm";
import { db } from "@/lib/db";

// 확인 기록 쓰기(서버 액션). 검사는 여기서 한다 — 브라우저 검사는 건너뛸 수 있으니 서버가 진짜 문지기.
// 이 파일에서는 async 함수만 export한다(처음 상태 값 · 형은 components/ReviewForm.tsx).

const STATUSES = ["확인 필요", "확인 완료", "보류"];

export async function addReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const field = (key: string) => String(formData.get(key) ?? "").trim();
  const buyerId = field("buyerId");
  const status = field("status");
  const memo = field("memo");
  const reviewer = field("reviewer");

  // 처음 걸린 하나만 돌려준다(저장하지 않는다)
  if (!STATUSES.includes(status)) return { ok: false, message: "상태를 골라 주세요" };
  if (memo.length === 0) return { ok: false, message: "메모를 적어 주세요" };
  if (memo.length > 200) return { ok: false, message: "메모는 200자 이내로 적어 주세요" };
  if (reviewer.length === 0) return { ok: false, message: "확인한 사람(별명)을 적어 주세요" };
  if (reviewer.length > 20) return { ok: false, message: "별명은 20자 이내로 적어 주세요" };

  try {
    const buyer = await db().buyer.findUnique({ where: { id: buyerId }, select: { id: true } });
    if (!buyer) return { ok: false, message: "바이어를 찾을 수 없습니다" };
    await db().review.create({ data: { buyerId, status, memo, reviewer } });
  } catch {
    // 오류 글 · 주소는 화면에 쓰지 않는다
    return { ok: false, message: "저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요" };
  }

  revalidatePath(`/buyers/${buyerId}`);
  revalidatePath("/");
  return { ok: true, message: "저장했습니다 — 새로 고쳐도 남아 있습니다" };
}
