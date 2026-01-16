// src/pages/favorites/pc/FavoritesPc.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

import locationIcon from "../../../icon/Location.png";
import shareIcon from "../../../icon/Share.png";

export default function FavoritesPC() {
  const initial = useMemo(
    () => [
      { id: "f1", name: "카페이름", hours: "00:00 - 00:00", reviews: "0,000개", memo: "" },
      { id: "f2", name: "카페이름", hours: "00:00 - 00:00", reviews: "0,000개", memo: "" },
      { id: "f3", name: "카페이름", hours: "00:00 - 00:00", reviews: "0,000개", memo: "" },
      { id: "f4", name: "카페이름", hours: "00:00 - 00:00", reviews: "0,000개", memo: "" },
      { id: "f5", name: "카페이름", hours: "00:00 - 00:00", reviews: "0,000개", memo: "" },
      { id: "f6", name: "카페이름", hours: "00:00 - 00:00", reviews: "0,000개", memo: "" },
      { id: "f7", name: "카페이름", hours: "00:00 - 00:00", reviews: "0,000개", memo: "" },
      { id: "f8", name: "카페이름", hours: "00:00 - 00:00", reviews: "0,000개", memo: "" },
    ],
    []
  );

  const [items, setItems] = useState(initial);

  
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

  const sortedItems = useMemo(() => {
    const arr = [...items];

    // 실제 데이터 붙이면 여기 로직만 바꾸면 됨
    if (sortKey === "이름순") {
      arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } else if (sortKey === "추천순") {
      // 지금은 추천 데이터 없어서 "그대로"
      // 나중에 rating/likes 같은 값 생기면 여기에 sort 넣으면 됨
    } else if (sortKey === "거리순") {
      // 지금은 거리 데이터 없어서 "그대로"
      // 나중에 distM 같은 값 생기면 여기에 sort 넣으면 됨
    }

    return arr;
  }, [items, sortKey]);

  const updateMemo = (id, memo) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, memo } : it)));
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

      {/*  Sort bar: v 고정 + dropdown */}
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
            {["이름순", "추천순", "거리순"].map((k) => (
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

      <div style={styles.list}>
        {sortedItems.map((cafe, idx) => (
          <FavoriteRow
            key={cafe.id}
            cafe={cafe}
            placeholder={idx === 0 ? "내 메모" : "나의 한마디"}
            onMemoChange={(v) => updateMemo(cafe.id, v)}
          />
        ))}
      </div>
    </div>
  );
}

function FavoriteRow({ cafe, placeholder, onMemoChange }) {
  return (
    <div style={styles.row}>
      {/* Left */}
      <div style={styles.leftBlock}>
        <span style={styles.rowStar} aria-hidden="true">
          ★
        </span>
        <div style={styles.info}>
          <div style={styles.name}>{cafe.name}</div>
          <div style={styles.meta}>영업시간 {cafe.hours}</div>
          <div style={styles.meta}>리뷰 {cafe.reviews}</div>
        </div>
      </div>

      {/* Mid */}
      <div style={styles.midBlock}>
        <div style={styles.midIconsRow}>
          <button type="button" style={styles.imgIconBtn} title="위치">
            <img src={locationIcon} alt="location" style={styles.imgIcon} />
          </button>
          <button type="button" style={styles.imgIconBtn} title="공유">
            <img src={shareIcon} alt="share" style={styles.imgIcon} />
          </button>
        </div>

        <button type="button" style={styles.memoPlus}>
          메모+
        </button>
      </div>

      {/* Right */}
      <div style={styles.memoWrap}>
        <div style={styles.bubble}>
          <div style={styles.bubbleTail} aria-hidden="true" />
          <input
            value={cafe.memo}
            onChange={(e) => onMemoChange(e.target.value)}
            placeholder={placeholder}
            style={styles.memoInput}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------- Styles -------------------- */

const PINK = "#84DEEE";
const LINE = "#E9E9E9";
const TEXT = "#4A4A4A";
const SUB = "#7A7A7A";

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
  brandStar: { fontSize: 42, color: PINK, lineHeight: 1 },
  brandTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: TEXT,
    letterSpacing: 0.2,
  },
  brandSub: { marginTop: 4, fontSize: 14, color: SUB, fontWeight: 600 },

  sortBar: {
    position: "relative",
    height: 46,
    padding: "0 22px",
    display: "flex",
    alignItems: "center",
    borderBottom: `1px solid ${LINE}`,
  },
  sortBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: TEXT,
    fontWeight: 700,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  sortArrow: { color: SUB, fontSize: 14, transform: "translateY(-1px)" },

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
  dropActive: {
    background: PINK,
    color: "#fff",
  },

  list: { 
    flex: 1,
    overflowY: "auto" },

  row: {
    height: 90,
    padding: "0 22px",
    display: "grid",
    gridTemplateColumns: "1fr 160px 520px",
    alignItems: "center",
    borderBottom: `1px solid ${LINE}`,
  },

  leftBlock: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
  rowStar: { fontSize: 22, color: PINK, width: 26, textAlign: "center" },

  info: { 
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
  },
  name: { fontSize: 16, fontWeight: 800, color: TEXT },
  meta: { marginTop: 4, fontSize: 12, color: SUB, fontWeight: 600 },

  midBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  midIconsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },

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
  imgIcon: {
    width: 22,
    height: 22,
    objectFit: "contain",
  },

  memoPlus: {
    height: 34,
    padding: "0 14px",
    borderRadius: 10,
    border: "none",
    background: PINK,
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
    border: `1px solid ${PINK}`,
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
    borderRight: `12px solid ${PINK}`,
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
