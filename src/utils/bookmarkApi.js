import { apiFetch } from "./apiClient";

export function fetchBookmarks({ token }) {
  return apiFetch("/api/auth/bookmarks/", { token, method: "GET" });
}

export async function addBookmark({ token, kakao_id, cafe_name }) {
  if (!kakao_id) {
    const err = new Error("kakao_id가 필요합니다.");
    err.code = "KAKAO_ID_REQUIRED";
    throw err;
  }

  const data = await apiFetch("/api/auth/bookmarks/", {
    token,
    method: "POST",
    body: JSON.stringify({
      kakao_id: String(kakao_id),
      cafe_name: cafe_name ?? "",
    }),
  });

  // ✅ 서버가 {bookmark:{...}}로 주면 bookmark만 반환
  return data?.bookmark ?? data;
}

export function deleteBookmark({ token, bookmark_id }) {
  return apiFetch(`/api/auth/bookmarks/${bookmark_id}/`, {
    token,
    method: "DELETE",
  });
}

// ✅ 메모 저장 (PATCH)
export async function patchBookmarkMemo({ token, bookmark_id, memo }) {
  const data = await apiFetch(`/api/auth/bookmarks/${bookmark_id}/memo/`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ memo: memo ?? "" }),
  });

  return data?.bookmark ?? data;
}
