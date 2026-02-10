import React, { useEffect, useMemo, useRef, useState } from "react";

import locationIcon from "../../../icon/Location.png";
import shareIcon from "../../../icon/Share.png";
import { useAuth } from "../../../providers/AuthProvider";
import { useBookmarks } from "../../../providers/BookmarksProvider";
import { openKakaoRouteToPlace} from "../../../utils/cafeApi";




const BLUE = "#84DEEE";
const LINE = "#E9E9E9";
const TEXT = "#4A4A4A";
const SUB = "#7A7A7A";

export default function FavoritesPC() {
  const { isAuthed } = useAuth();
  const { items: bookmarks, loading, error, refresh, toggle, saveMemo } = useBookmarks();

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

  // ✅ 서버에서 내려온 memo로 draft 초기 세팅(이미 입력중인 건 유지)
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
      // 거리 데이터 없으니 유지
    }

    return arr;
  }, [bookmarks, sortKey]);

  const onChangeMemo = (kakaoId, value) => {
    const kid = String(kakaoId || "").trim();
    if (!kid) return;
    setMemoDraft((prev) => ({ ...prev, [kid]: value }));
  };

  // ✅ 현재 bookmarks(상태)에서 kakaoId로 bookmarkId 찾기
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

      // 1) 우선 row에 달린 id 사용 시도
      let bookmarkId = cafe?.id;
      if (!bookmarkId || String(bookmarkId).startsWith("temp_")) bookmarkId = null;

      // 2) id가 없거나 temp면, 최신 목록 강제 refresh 후 다시 찾기
      if (!bookmarkId) {
        await refresh({ force: true });
        bookmarkId = findBookmarkIdByKakaoId(kid);
      }

      if (!bookmarkId) {
        // 여기 오면 서버에 즐겨찾기가 없는 상태(이미 삭제됐거나 sync 깨짐)
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
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <span style={styles.brandStar}>★</span>
          <div>
            <div style={styles.brandTitle}>MY CAFE</div>
            <div style={styles.brandSub}>내가 즐겨찾기한 카페</div>
          </div>
        </div>
      </header>


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
              <FavoriteRow
                key={cafe.id ?? `${kid}_${idx}`}
                cafe={cafe}
                memoValue={draft}
                placeholder="내 메모" 
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

function FavoriteRow({ cafe, memoValue, placeholder, saving, onMemoChange, onSaveMemo, onToggleFav }) {
  return (
    <div style={styles.row}>
      <div style={styles.leftBlock}>
        <button type="button" onClick={onToggleFav} style={styles.rowStarBtn} title="즐겨찾기 삭제">
          ★
        </button>
        <div style={styles.info}>
          <div style={styles.name}>{cafe.name}</div>
        </div>
      </div>

      <div style={styles.midBlock}>
        <div style={styles.midIconsRow}>
          <button
            type="button"
            style={styles.imgIconBtn}
            title="길찾기"
            onClick={() => openKakaoRouteToPlace({ name: cafe.name, lat: cafe.lat, lng: cafe.lng })}
          >
            <img src={locationIcon} alt="location" style={styles.imgIcon} />
          </button>

          <button
            type="button"
            style={styles.imgIconBtn}
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
            <img src={shareIcon} alt="location" style={styles.imgIcon} />
          </button>
        </div>

        <button
          type="button"
          style={{ ...styles.memoPlus, ...(saving ? { opacity: 0.7, cursor: "not-allowed" } : null) }}
          disabled={saving}
          onClick={onSaveMemo}
          title="메모 저장"
        >
          {saving ? "저장중..." : "메모+"}
        </button>
      </div>

      <div style={styles.memoWrap}>
        <div style={styles.bubble}>
          <div style={styles.bubbleTail} aria-hidden="true" />
          <input
            value={memoValue}
            onChange={(e) => onMemoChange(e.target.value)}
            placeholder={placeholder}
            style={styles.memoInput}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */

const styles = {
  page: {
    width: "92vw",
    height: "100vh",
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    height: 92,
    padding: "18px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brandRow: { display: "flex", alignItems: "center", gap: 14 },
  brandStar: { fontSize: 42, color: BLUE, lineHeight: 1 },
  brandTitle: { fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: 0.2, textAlign: "left" },
  brandSub: { marginTop: 4, fontSize: 14, color: SUB, fontWeight: 600 },


  dropdown: {
    position: "absolute",
    top: 46,
    left: 22,
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
    fontSize: 14,
    fontWeight: 700,
    color: TEXT,
    textAlign: "left",
  },
  dropActive: { background: BLUE, color: "#fff" },

  list: { flex: 1, overflowY: "auto" },

  row: {
    height: 90,
    padding: "0 22px",
    display: "grid",
    gridTemplateColumns: "1fr 160px 520px",
    alignItems: "center",
    borderBottom: `1px solid ${LINE}`,
  },

  leftBlock: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
  rowStarBtn: {
    fontSize: 22,
    color: BLUE,
    width: 26,
    textAlign: "center",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
  },

  emptyBox: { padding: "18px 22px", color: SUB, fontWeight: 700 },
  retryBtn: {
    border: "1px solid #82DAEB",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 800,
  },

  info: { minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" },
  name: { fontSize: 16, fontWeight: 800, color: TEXT },
  meta: { marginTop: 4, fontSize: 12, color: SUB, fontWeight: 600 },

  midBlock: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, justifyContent: "center" },
  midIconsRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 0 },

  imgIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  imgIcon: { width: 22, height: 22, objectFit: "contain" },

  memoPlus: {
    height: 34,
    padding: "0 14px",
    borderRadius: 10,
    border: "none",
    background: BLUE,
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  memoWrap: { display: "flex", justifyContent: "flex-end" },

  bubble: {
    position: "relative",
    width: "100%",
    maxWidth: 520,
    height: 52,
    borderRadius: 10,
    border: `1px solid ${BLUE}`,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 14,
  },

  bubbleTail: {
    position: "absolute",
    left: -12,
    top: 16,
    width: 0,
    height: 0,
    borderTop: "10px solid transparent",
    borderBottom: "10px solid transparent",
    borderRight: `12px solid ${BLUE}`,
  },

  memoInput: {
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    fontSize: 13,
    fontWeight: 600,
    color: TEXT,
  },
};
