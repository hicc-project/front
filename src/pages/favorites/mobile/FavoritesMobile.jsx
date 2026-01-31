// src/pages/favorites/mobile/FavoritesMobile.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";

import locationIcon from "../../../icon/Location.png";
import shareIcon from "../../../icon/Share.png";
import { useAuth } from "../../../providers/AuthProvider";
import { useBookmarks } from "../../../providers/BookmarksProvider";

export default function FavoritesMobile() {
  const { isAuthed } = useAuth();
  const { items: bookmarks, loading, error, refresh, toggle } = useBookmarks();

  const [memoByName, setMemoByName] = useState({});

  /* ---------- sort ---------- */
  const [sortKey, setSortKey] = useState("이름순");
  const [open, setOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (!sortRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const cafes = useMemo(() => {
    const arr = bookmarks.map((b) => ({
      id: b.id,
      kakaoId: b.kakao_id,
      name: b.cafe_name,
      hours: "영업시간 정보 없음",
      memo: memoByName[b.kakao_id] ?? "",
    }));

    if (sortKey === "이름순") arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return arr;
  }, [bookmarks, memoByName, sortKey]);

  const onMemoChange = (cafeName, v) => {
    setMemoByName((prev) => ({ ...prev, [cafeName]: v }));
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

      {/* Sort bar */}
      <div style={styles.sortBar} ref={sortRef}>
        <button
          type="button"
          style={styles.sortBtn}
          onClick={() => setOpen((v) => !v)}
        >
          <span style={styles.sortArrow}>v</span>
          <span>{sortKey}</span>
        </button>

        {open && (
          <div style={styles.dropdown}>
            {["이름순", "거리순"].map((k) => (
              <button
                key={k}
                type="button"
                style={{
                  ...styles.dropItem,
                  ...(k === sortKey ? styles.dropActive : null),
                }}
                onClick={() => {
                  setSortKey(k);
                  setOpen(false);
                }}
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </div>

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
        ) : cafes.length === 0 ? (
          <div style={styles.emptyBox}>아직 즐겨찾기한 카페가 없어요.</div>
        ) : (
          cafes.map((cafe) => (
            <MobileRow
              key={cafe.id}
              cafe={cafe}
              onMemoChange={onMemoChange}
              onToggleFav={async () => {
                try {
                  await toggle(cafe.kakaoId, cafe.name);
                } catch (e) {
                  alert(e?.message || "즐겨찾기 처리 실패");
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- Row ---------------- */

function MobileRow({ cafe, onMemoChange, onToggleFav }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowTop}>
        <div style={styles.left}>
          <button type="button" onClick={onToggleFav} style={styles.rowStarBtn} title="즐겨찾기 삭제">
            ★
          </button>
          <div style ={styles.rowBody}>
            <div style={styles.name}>{cafe.name}</div>
            <div style={styles.meta}>영업시간 {cafe.hours}</div>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.iconRow}>
            <button style={styles.iconBtn}>
              <img src={locationIcon} alt="location" style={styles.iconImg} />
            </button>
            <button style={styles.iconBtn}>
              <img src={shareIcon} alt="share" style={styles.iconImg} />
            </button>
          </div>

          <button style={styles.memoBtn}>메모+</button>
        </div>
      </div>

      <div style={styles.bubble}>
        <input
          value={cafe.memo}
          onChange={(e) => onMemoChange(cafe.kakaoId, e.target.value)}
          placeholder="나의 한마디"
          style={styles.bubbleInput}
        />
        <div style={styles.bubbleTail} />
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */

const PINK = "#84DEEE";
const LINE = "#E9E9E9";
const TEXT = "#4A4A4A";
const SUB = "#7A7A7A";

const styles = {
  page: {
    height: "100%",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },

  header: { padding: "18px 16px 10px" },
  headerRow: { display: "flex", gap: 10, alignItems: "center" },
  headerStar: { fontSize: 26, color: PINK },
  title: { fontSize: 20, fontWeight: 900, color: TEXT,textAlign: "left" },
  subTitle: { fontSize: 11, color: SUB },

  /* sort */
  sortBar: {
    position: "relative",
    padding: "8px 16px",
    borderBottom: `1px solid ${LINE}`,
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  sortBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "none",
    background: "transparent",
    fontSize: 14,
    fontWeight: 800,
    color: TEXT,
    cursor: "pointer",
  },
  sortArrow: { color: SUB, fontSize: 16, transform: "translateY(-2px) scaleX(1.4)" },

  dropdown: {
    position: "absolute",
    top: 44,
    left: 16,
    width: 110,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    overflow: "hidden",
    zIndex: 10,
  },
  dropItem: {
    width: "100%",
    height: 40,
    border: "none",
    background: "#fff",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "left",
    padding: "0 12px",
    cursor: "pointer",
  },
  dropActive: {
    background: PINK,
    color: "#fff",
  },

  list: { flex: 1, overflowY: "auto" },

  row: {
    padding: "14px 16px",
    borderBottom: `1px solid ${LINE}`,
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  left: { display: "flex", gap: 10 },
  rowStar: { color: PINK, fontSize: 22 },
  rowStarBtn: {
    color: PINK,
    fontSize: 22,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
  },

  emptyBox: {
    padding: "18px 16px",
    color: SUB,
    fontWeight: 700,
  },
  retryBtn: {
    border: "1px solid #82DAEB",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 800,
  },
  name: { fontSize: 16, fontWeight: 900, color: TEXT },
  meta: { fontSize: 12, color: SUB, marginTop: 4 },

  right: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  iconRow: { display: "flex", gap: 8 },
  iconBtn: { border: "none", background: "transparent", padding: 0 },
  iconImg: { width: 18, height: 18 },

  memoBtn: {
    background: PINK,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    height: 32,
    padding: "0 14px",
    fontWeight: 800,
  },

  bubble: {
    marginTop: 10,
    position: "relative",
    border: `1px solid ${PINK}`,
    borderRadius: 10,
    height: 46,
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
  },
  bubbleInput: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: 13,
  },
  bubbleTail: {
    position: "absolute",
    right: 24,
    top: -8,
    width: 0,
    height: 0,
    borderLeft: "8px solid transparent",
    borderRight: "8px solid transparent",
    borderBottom: `8px solid ${PINK}`,
  },
  rowBody: {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",   
  textAlign: "left",          
  gap: 2,
 }
};
