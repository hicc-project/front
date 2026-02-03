// src/providers/BookmarksProvider.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import {
  addBookmark,
  deleteBookmark,
  fetchBookmarks,
  patchBookmarkMemo, //  추가
} from "../utils/bookmarkApi";

const BookmarksContext = createContext(null);

function normalizeBookmark(raw) {
  const r = raw?.bookmark ? raw.bookmark : raw;

  const id = r?.id ?? r?.bookmark_id ?? r?.bookmarkId;
  const cafe_name = r?.cafe_name ?? r?.cafeName ?? r?.name; // 서버가 name으로 줄 수 있음
  const kakao_id = r?.kakao_id ?? r?.kakaoId ?? r?.place_id ?? r?.placeId;

  return { ...r, id, cafe_name, kakao_id };
}


export function BookmarksProvider({ children }) {
  const { token, isAuthed } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastFetchAtRef = useRef(0);

  const refresh = useCallback(
    async ({ force = false } = {}) => {
      if (!isAuthed) {
        setItems([]);
        setLoading(false);
        setError("");
        return;
      }

      const now = Date.now();
      if (!force && now - lastFetchAtRef.current < 3_000) return;
      lastFetchAtRef.current = now;

      setLoading(true);
      setError("");
      try {
        const data = await fetchBookmarks({ token });

        const arr = Array.isArray(data)
          ? data
          : data?.results ?? data?.data ?? data?.bookmarks ?? [];

        const normalized = arr
          .map(normalizeBookmark)
          .filter((b) => b.id && (b.kakao_id || b.cafe_name));

        setItems(normalized);
      } catch (e) {
        setError(e?.message || "즐겨찾기 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [isAuthed, token]
  );

  useEffect(() => {
    refresh({ force: true });
  }, [refresh]);

  const byKakaoId = useMemo(() => {
    const m = new Map();
    for (const b of items) {
      const k = b?.kakao_id != null ? String(b.kakao_id) : "";
      if (k) m.set(k, b);
    }
    return m;
  }, [items]);

  const isBookmarked = useCallback(
    (kakaoId) => {
      if (!kakaoId) return false;
      return byKakaoId.has(String(kakaoId));
    },
    [byKakaoId]
  );

  const toggle = useCallback(
    async (kakaoId, cafeName = "") => {
      if (!isAuthed) {
        const err = new Error("LOGIN_REQUIRED");
        err.code = "LOGIN_REQUIRED";
        throw err;
      }

      const kid = String(kakaoId || "").trim();
      if (!kid) {
        const err = new Error("kakao_id가 필요합니다.");
        err.code = "KAKAO_ID_REQUIRED";
        throw err;
      }

      const existing = byKakaoId.get(kid);

      // add
      if (!existing) {
        const tempId = `temp_${Date.now()}`;
        const temp = { id: tempId, kakao_id: kid, cafe_name: cafeName || kid, memo: "" };
        setItems((prev) => [temp, ...prev]);

        try {
          const created = await addBookmark({ token, kakao_id: kid, cafe_name: cafeName || "" });

          // ✅ 서버가 {message, bookmark:{...}} 형태면 bookmark를 꺼내서 normalize
          const createdObj = created?.bookmark ?? created;
          const norm0 = normalizeBookmark(createdObj);

          const norm = {
            ...norm0,
            kakao_id: String(norm0.kakao_id ?? kid),
            cafe_name: norm0.cafe_name ?? cafeName ?? "",
          };

          setItems((prev) => {
            const withoutTemp = prev.filter((x) => x.id !== tempId);
            const filtered = withoutTemp.filter(
              (x) => String(x.kakao_id ?? "") !== String(norm.kakao_id)
            );
            return [norm, ...filtered];
          });

          return { action: "added", bookmark: norm };
        } catch (e) {
          setItems((prev) => prev.filter((x) => x.id !== tempId));
          throw e;
        }
      }

      // remove
      setItems((prev) => prev.filter((x) => String(x.kakao_id ?? "") !== kid));

      try {
        let bookmarkId = existing.id ?? existing.bookmark_id ?? existing.bookmarkId;

        if (!bookmarkId || String(bookmarkId).startsWith("temp_")) {
          const data = await fetchBookmarks({ token });
          const arr = Array.isArray(data)
            ? data
            : data?.results ?? data?.data ?? data?.bookmarks ?? [];
          const normalized = arr.map(normalizeBookmark);
          const found = normalized.find((b) => String(b.kakao_id ?? "") === kid);
          bookmarkId = found?.id;

          if (!bookmarkId) return { action: "removed", bookmark: existing };

          await deleteBookmark({ token, bookmark_id: bookmarkId });
          refresh({ force: true });
          return { action: "removed", bookmark: found ?? existing };
        }

        await deleteBookmark({ token, bookmark_id: bookmarkId });
        refresh({ force: true });
        return { action: "removed", bookmark: existing };
      } catch (e) {
        setItems((prev) => [existing, ...prev]);
        throw e;
      }
    },
    [isAuthed, byKakaoId, token, refresh]
  );

  // ✅ 추가: 메모 저장 (PATCH) 후 items를 서버 응답으로 갱신
  const saveMemo = useCallback(
    async ({ bookmarkId, memo }) => {
      if (!isAuthed) {
        const err = new Error("LOGIN_REQUIRED");
        err.code = "LOGIN_REQUIRED";
        throw err;
      }
      if (!bookmarkId) {
        const err = new Error("bookmark_id가 필요합니다.");
        err.code = "BOOKMARK_ID_REQUIRED";
        throw err;
      }

      const res = await patchBookmarkMemo({ token, bookmark_id: bookmarkId, memo });

      // 서버가 {message, bookmark:{...}} 형태
      const updatedObj = res?.bookmark ?? res;
      const updated = normalizeBookmark(updatedObj);

      // ✅ 여기서 id가 바뀌는 케이스(너가 겪는 케이스)를 반영
      setItems((prev) => {
        // kakao_id 기준으로 같은 항목 찾아서 교체
        const kid = String(updated.kakao_id ?? "");
        if (!kid) return prev;

        const next = prev.map((x) => (String(x.kakao_id ?? "") === kid ? { ...x, ...updated } : x));
        return next;
      });

      // (선택) 완전 싱크 원하면 아래도 OK
      // refresh({ force: true });

      return updated;
    },
    [isAuthed, token]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      refresh,
      isBookmarked,
      toggle,
      saveMemo, // ✅ 노출
    }),
    [items, loading, error, refresh, isBookmarked, toggle, saveMemo]
  );

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
