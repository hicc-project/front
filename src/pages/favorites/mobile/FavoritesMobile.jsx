// src/pages/favorites/mobile/FavoritesMobile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

import locationIcon from "../../../icon/Location.png";
import shareIcon from "../../../icon/Share.png";
import { useAuth } from "../../../providers/AuthProvider";
import { useBookmarks } from "../../../providers/BookmarksProvider";
import { openKakaoRouteToPlace } from "../../../utils/cafeApi"; 

const PINK = "#84DEEE";
const LINE = "#E9E9E9";
const TEXT = "#4A4A4A";
const SUB = "#7A7A7A";

export default function FavoritesMobile() {
  const { isAuthed } = useAuth();
  const { items: bookmarks, loading, error, refresh, toggle, saveMemo } = useBookmarks();

  /* ---------- sort ---------- */
  const [sortKey, setSortKey] = useState("이름순");
  const [open, setOpen] = useState(false);
  const sortRef = useRef(null);

  // ✅ 메모 입력 draft (kakaoId 기준)
  const [memoDraft, setMemoDraft] = useState({}); // { [kakaoId]: string }
  const [saving, setSaving] = useState({}); // { [kakaoId]: boolean }

  useEffect(() => {
    const onClick = (e) => {
      if (!sortRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ✅ 서버 memo로 draft 초기화(이미 입력중인 건 유지)
  useEffect(() => {
    setMemoDraft((prev) => {
      const next = { ...prev };
      for (const b of bookmarks) {
        const kid = String(b.kakao_id ?? "").trim();
        if (!kid) continue;
        if (next[kid] === undefined) next[kid] = b.memo ?? "";
      }
      return next;
    });
  }, [bookmarks]);

  const sortedItems = useMemo(() => {
    const arr = bookmarks.map((b) => ({
      id: b.id,
      kakaoId: String(b.kakao_id ?? ""),
      name: b.cafe_name ?? b.name ?? "",
      memo: b.memo ?? "",
      lat: typeof b.lat === "number" ? b.lat : Number(b.lat),
      lng: typeof b.lng === "number" ? b.lng : Number(b.lng),
    }));

    if (sortKey === "이름순") {
      arr.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
    } else if (sortKey === "거리순") {
      // 모바일 즐겨찾기엔 거리 데이터 없으니 유지
    }
    return arr;
  }, [bookmarks, sortKey]);

  const onChangeMemo = (kakaoId, value) => {
    const kid = String(kakaoId || "").trim();
    if (!kid) return;
    setMemoDraft((prev) => ({ ...prev, [kid]: value }));
  };

  // ✅ 현재 bookmarks에서 kakaoId로 bookmarkId 찾기
  const findBookmarkIdByKakaoId = (kakaoId) => {
    const kid = String(kakaoId || "").trim();
    if (!kid) return null;
    const found = bookmarks.find((b) => String(b.kakao_id ?? "") === kid);
    const id = found?.id;
    if (!id) return null;
    if (String(id).startsWith("temp_")) return null;
    return id;
  };

  const onSaveMemo = async (cafe) => {
    const kid = String(cafe?.kakaoId || "").trim();
    if (!kid) return;

    const text = memoDraft[kid] ?? "";

    try {
      setSaving((prev) => ({ ...prev, [kid]: true }));

      // 1) 우선 row의 id 사용
      let bookmarkId = cafe?.id;
      if (!bookmarkId || String(bookmarkId).startsWith("temp_")) bookmarkId = null;

      // 2) 없으면 강제 refresh 후 찾기
      if (!bookmarkId) {
        await refresh({ force: true });
        bookmarkId = findBookmarkIdByKakaoId(kid);
      }

      if (!bookmarkId) {
        alert("즐겨찾기 id를 찾을 수 없어요. (이미 삭제되었을 수 있어요)");
        return;
      }

      await saveMemo({ bookmarkId, memo: text });

      // ✅ 완전 싱크
      await refresh({ force: true });
      alert("메모가 저장되었습니다.");
    } catch (e) {
      alert(e?.message || "메모 저장 실패");
    } finally {
      setSaving((prev) => ({ ...prev, [kid]: false }));
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerRow}>
          <span style={styles.headerStar}>★</span>
          <div>
            <div style={styles.title}>MY CAFE</div>
            <div style={styles.subTitle}>내가 즐겨찾기한 카페</div>
          </div>
        </div>
      </header>



      {/* List */}
      <div style={styles.list}>
        {!isAuthed ? (
          <div style={styles.emptyBox}>즐겨찾기는 로그인 후 사용할 수 있어요.</div>
        ) : loading ? (
          <div style={styles.emptyBox}>불러오는 중...</div>
        ) : error ? (
          <div style={styles.emptyBox}>
            <div style={{ marginBottom: 10 }}>{error}</div>
            <button type="button" style={styles.retryBtn} onClick={() => refresh({ force: true })}>
              다시 시도
            </button>
          </div>
        ) : sortedItems.length === 0 ? (
          <div style={styles.emptyBox}>아직 즐겨찾기한 카페가 없어요.</div>
        ) : (
          sortedItems.map((cafe, idx) => {
            const kid = cafe.kakaoId;
            const draft = memoDraft[kid] ?? cafe.memo ?? "";
            const isSaving = !!saving[kid];

            return (
              <MobileRow
                key={cafe.id ?? `${kid}_${idx}`}
                cafe={cafe}
                memoValue={draft}
                placeholder={idx === 0 ? "내 메모" : "나의 한마디"}
                saving={isSaving}
                onMemoChange={(v) => onChangeMemo(kid, v)}
                onSaveMemo={() => onSaveMemo(cafe)}
                onToggleFav={async () => {
                  try {
                    await toggle(kid, cafe.name);
                    await refresh({ force: true });
                  } catch (e) {
                    alert(e?.message || "즐겨찾기 처리 실패");
                  }
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------------- Row ---------------- */

function MobileRow({ cafe, memoValue, placeholder, saving, onMemoChange, onSaveMemo, onToggleFav }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowTop}>
        <div style={styles.left}>
          <button type="button" onClick={onToggleFav} style={styles.rowStarBtn} title="즐겨찾기 삭제">
            ★
          </button>

          <div style={styles.rowBody}>
            <div style={styles.name}>{cafe.name}</div>
            {/* 즐겨찾기엔 영업시간/거리 없음 */}
            <div style={styles.meta}>메모를 남겨보세요</div>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.iconRow}>
            <button
              type="button"
              style={styles.iconBtn}
              title="길찾기"
              onClick={() => openKakaoRouteToPlace({ name: cafe.name, lat: cafe.lat, lng: cafe.lng })}
            >
              <img src={locationIcon} alt="location" style={styles.iconImg} />
            </button>


            <button
              type="button"
              style={styles.iconBtn}
              title="카카오맵에서 보기"
              onClick={() => {
                const kid = String(cafe?.kakaoId || "").trim();
                if (!kid) {
                  alert("카카오 장소 ID가 없습니다.");
                  return;
                }
                window.open(`https://place.map.kakao.com/${kid}`, "_blank", "noopener,noreferrer");
              }}
            >
              <img src={shareIcon} alt="location" style={styles.iconImg} />
            </button>
          </div>

          <button
            type="button"
            style={{ ...styles.memoBtn, ...(saving ? { opacity: 0.7 } : null) }}
            disabled={saving}
            onClick={onSaveMemo}
          >
            {saving ? "저장중..." : "메모+"}
          </button>
        </div>
      </div>

      <div style={styles.bubble}>
        <input
          value={memoValue}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder={placeholder}
          style={styles.bubbleInput}
        />
        <div style={styles.bubbleTail} />
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    height: 84,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    borderBottom: `1px solid ${LINE}`,
  },
  headerRow: { display: "flex", alignItems: "center", gap: 12 },
  headerStar: { fontSize: 34, color: PINK, lineHeight: 1 },
  title: { fontSize: 22, fontWeight: 900, color: TEXT },
  subTitle: { marginTop: 2, fontSize: 12, fontWeight: 700, color: SUB },

  sortBar: {
    position: "relative",
    height: 44,
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    borderBottom: `1px solid ${LINE}`,
  },
  sortBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: TEXT,
    fontWeight: 800,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  sortArrow: { marginTop: 2, color: SUB, fontSize: 14 },

  dropdown: {
    position: "absolute",
    top: 44,
    left: 16,
    width: 140,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
    overflow: "hidden",
    zIndex: 10,
    border: "1px solid #eee",
  },
  dropItem: {
    width: "100%",
    height: 44,
    border: "none",
    background: "#fff",
    padding: "0 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    color: TEXT,
    textAlign: "left",
  },
  dropActive: { background: PINK, color: "#fff" },

  list: { flex: 1, overflowY: "auto" },

  emptyBox: { padding: "16px", color: SUB, fontWeight: 700 },
  retryBtn: {
    border: "1px solid #82DAEB",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 900,
  },

  row: {
    padding: "12px 16px",
    borderBottom: `1px solid ${LINE}`,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  rowTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  left: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
  rowStarBtn: {
    fontSize: 20,
    color: PINK,
    width: 26,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
  },

  rowBody: { display: "flex", flexDirection: "column", minWidth: 0 },
  name: { fontSize: 15, fontWeight: 900, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  meta: { marginTop: 4, fontSize: 12, color: SUB, fontWeight: 700 },

  right: { display: "flex", alignItems: "center", gap: 10 },
  iconRow: { display: "flex", alignItems: "center", gap: 2 },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  iconImg: { width: 22, height: 22, objectFit: "contain" },

  memoBtn: {
    height: 34,
    padding: "0 12px",
    borderRadius: 10,
    border: "none",
    background: PINK,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  bubble: {
    position: "relative",
    width: "100%",
    height: 46,
    borderRadius: 10,
    border: `1px solid ${PINK}`,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 14,
  },
  bubbleTail: {
    position: "absolute",
    right: 18,
    top: -10,
    width: 0,
    height: 0,
    borderLeft: "10px solid transparent",
    borderRight: "10px solid transparent",
    borderBottom: `10px solid ${PINK}`,
  },
  bubbleInput: {
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    fontSize: 13,
    fontWeight: 700,
    color: TEXT,
    background: "transparent",
  },
};
