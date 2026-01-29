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
import { addBookmark, deleteBookmark, fetchBookmarks } from "../utils/bookmarkApi";

const BookmarksContext = createContext(null);

// 백엔드가 반환하는 키 이름이 조금씩 달라도 대응
function normalizeBookmark(raw) {
  const id = raw?.id ?? raw?.bookmark_id ?? raw?.bookmarkId;
  const cafe_name = raw?.cafe_name ?? raw?.cafeName ?? raw?.name;
  const kakao_id = raw?.kakao_id ?? raw?.kakaoId ?? raw?.place_id ?? raw?.placeId;
  return { ...raw, id, cafe_name, kakao_id };
}

export function BookmarksProvider({ children }) {
  const { token, isAuthed } = useAuth();

  const [items, setItems] = useState([]); // normalized bookmarks
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
      // 너무 자주 조회 방지(짧은 TTL)
      if (!force && now - lastFetchAtRef.current < 3_000) return;
      lastFetchAtRef.current = now;

      setLoading(true);
      setError("");
      try {
        const data = await fetchBookmarks({ token });
        const arr = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];
        const normalized = arr
          .map(normalizeBookmark)
          .filter((b) => b.id && (b.kakao_id || b.cafe_name)); // kakao_id가 우선이지만, 혹시 없으면 name이라도 남김
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
    // 토큰 바뀌면 목록 갱신
    refresh({ force: true });
  }, [refresh]);

  // ✅ kakao_id 기준 맵
  const byKakaoId = useMemo(() => {
    const m = new Map();
    for (const b of items) {
      const k = b?.kakao_id != null ? String(b.kakao_id) : "";
      if (k) m.set(k, b);
    }
    return m;
  }, [items]);

  // (옵션) 혹시 kakao_id가 없는 데이터도 대비용 name 맵
  const byName = useMemo(() => {
    const m = new Map();
    for (const b of items) {
      const k = b?.cafe_name != null ? String(b.cafe_name) : "";
      if (k) m.set(k, b);
    }
    return m;
  }, [items]);

  // ✅ 이제 isBookmarked는 "kakaoId" 기준
  const isBookmarked = useCallback(
    (kakaoId) => {
      if (!kakaoId) return false;
      return byKakaoId.has(String(kakaoId));
    },
    [byKakaoId]
  );

  // ✅ toggle도 (kakaoId, cafeName) 형태로 변경
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

      // optimistic
      if (!existing) {
        const tempId = `temp_${Date.now()}`;
        const temp = {
          id: tempId,
          kakao_id: kid,
          cafe_name: cafeName || kid,
        };
        setItems((prev) => [temp, ...prev]);

        try {
          const created = await addBookmark({
            token,
            kakao_id: kid, // ✅ 서버가 요구
            cafe_name: cafeName || "",
          });
          const norm0 = normalizeBookmark(created);

          // ✅ 서버 응답이 어떻든, 우리가 클릭한 kid를 진실로 박아넣기
          const norm = {
            ...norm0,
            kakao_id: String(norm0.kakao_id ?? kid),
            cafe_name: norm0.cafe_name ?? cafeName ?? "",
          };
          setItems((prev) => {
            const withoutTemp = prev.filter((x) => x.id !== tempId);

            // ✅ 같은 kakao_id 중복 제거(반드시 kid 기준)
            const filtered = withoutTemp.filter((x) => String(x.kakao_id ?? "") !== String(norm.kakao_id));

            return [norm, ...filtered];
          });

          return { action: "added", bookmark: norm };
        } catch (e) {
          // rollback
          setItems((prev) => prev.filter((x) => x.id !== tempId));
          throw e;
        }
      } else {
          // optimistic remove (kakao_id 기준)
          setItems((prev) => prev.filter((x) => String(x.kakao_id ?? "") !== kid));

          try {
            // 1) 일단 existing에서 bookmarkId 시도
            let bookmarkId = existing.id ?? existing.bookmark_id ?? existing.bookmarkId;

            // 2) bookmarkId가 없거나 temp면: 서버에서 최신 목록을 직접 받아서 realId를 찾아서 즉시 삭제
            if (!bookmarkId || String(bookmarkId).startsWith("temp_")) {
              // 서버 최신 목록
              const data = await fetchBookmarks({ token });
              const arr = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];
              const normalized = arr.map(normalizeBookmark);

              const found = normalized.find((b) => String(b.kakao_id ?? "") === kid);
              bookmarkId = found?.id ?? found?.bookmark_id ?? found?.bookmarkId;

              if (!bookmarkId) {
                // 서버에도 이미 없으면 삭제 완료로 간주
                return { action: "removed", bookmark: existing };
              }

              await deleteBookmark({ token, bookmark_id: bookmarkId });

              // UI 상태도 서버 최신으로 맞춰주기(선택이지만 안정적)
              refresh({ force: true });
              return { action: "removed", bookmark: found ?? existing };
            }

            // 3) 정상 케이스
            await deleteBookmark({ token, bookmark_id: bookmarkId });

            // 선택: 서버와 싱크
            refresh({ force: true });

            return { action: "removed", bookmark: existing };
          }catch (e) {
          // rollback
          setItems((prev) => [existing, ...prev]);
          throw e;
        }
      }
    },  
    [isAuthed, byKakaoId, token, refresh]
  );



  // (옵션) 혹시 즐겨찾기 페이지에서 이름으로 찾고 싶은 경우를 위한 헬퍼
  const getByName = useCallback(
    (name) => {
      if (!name) return null;
      return byName.get(String(name)) || null;
    },
    [byName]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      refresh,
      isBookmarked,
      toggle,
      // optional helper
      getByName,
    }),
    [items, loading, error, refresh, isBookmarked, toggle, getByName]
  );

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
