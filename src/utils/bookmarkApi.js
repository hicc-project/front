// src/utils/bookmarkApi.js
import { apiFetch } from "./apiClient";

export function fetchBookmarks({ token }) {
  return apiFetch("/api/auth/bookmarks/", { token, method: "GET" });
}

export function addBookmark({ token, kakao_id, cafe_name }) {
  if (!kakao_id) {
    const err = new Error("kakao_id가 필요합니다.");
    err.code = "KAKAO_ID_REQUIRED";
    throw err;
  }

  return apiFetch("/api/auth/bookmarks/", {
    token,
    method: "POST",
    body: JSON.stringify({
      kakao_id: String(kakao_id),   
      cafe_name: cafe_name ?? "",   // 선택(있으면 저장/표시용)
    }),
  });
}

export function deleteBookmark({ token, bookmark_id }) {
  return apiFetch(`/api/auth/bookmarks/${bookmark_id}/`, {
    token,
    method: "DELETE",
  });
}
