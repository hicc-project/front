// src/pages/home/mobile/HomeMobile.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import settingsIcon from "../../../icon/Settings_gray.png";

export default function HomeMobile() {
  const navigate = useNavigate(); 

  const recCards = useMemo(
    () => [
      {
        tag: "✦ 오늘의 추천 카페",
        name: "소과당 홍대점",
        hours: "영업중 11:00-22:00",
        km: "0.7km",
        reviews: "리뷰 1,929",
      },
      {
        tag: "✦ 친구와 함께 가기",
        name: "메이플런지",
        hours: "영업중 12:00-20:00",
        km: "1.2km",
        reviews: "리뷰 2,037",
      },
    ],
    []
  );

  const newList = useMemo(
    () => [
      { km: "0.3km", name: "카페이름", time: "00:00 - 00:00" },
      { km: "0.5km", name: "카페이름", time: "00:00 - 00:00" },
      { km: "1.0km", name: "카페이름", time: "00:00 - 00:00" },
    ],
    []
  );

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <header style={styles.topbar}>
        <div style={styles.appName}>앱이름</div>

        <div style={styles.topIcons}>
          {/*  설정 아이콘 → /settings 이동 */}
          <button
            type="button"
            style={styles.iconBtn}
            aria-label="설정"
            onClick={() => navigate("/settings")}
          >
            <img src={settingsIcon} alt="설정" style={styles.iconImg} />
          </button>
        </div>
      </header>

      {/* Recommendation carousel */}
      <section style={styles.carouselSection}>
        <div style={styles.carousel}>
          {recCards.map((c, idx) => (
            <div key={idx} style={styles.recCard}>
              <div style={styles.recTag}>{c.tag}</div>

              <div style={styles.recImage}>
                <div style={styles.imagePlaceholder} />
                <button
                  type="button"
                  style={styles.starOnImage}
                  aria-label="즐겨찾기"
                >
                  ☆
                </button>
              </div>

              <div style={styles.recFooter}>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.recName}>{c.name}</div>
                  <div style={styles.recMeta}>{c.hours}</div>
                </div>

                <div style={styles.recRight}>
                  <div>{c.km}</div>
                  <div>{c.reviews}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEW section */}
      <section style={styles.newSection}>
        <div style={styles.newTitle}>NEW!</div>
        <div style={styles.newSub}>근처에 새로 생긴 카페를 즐겨보세요!</div>

        <div style={styles.newList}>
          {newList.map((x, idx) => (
            <div key={idx} style={styles.newRow}>
              <div style={styles.kmPill}>{x.km}</div>

              <div style={styles.newText}>
                <div style={styles.newName}>{x.name}</div>
                <div style={styles.newTime}>영업시간 {x.time}</div>
              </div>

              <button
                type="button"
                style={styles.favBtn}
                aria-label="즐겨찾기"
              >
                ☆
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 하단 네비 가림 방지 */}
      <div style={{ height: 90 }} />
    </div>
  );
}

/* ---------------- styles ---------------- */

const PINK = "#84DEEE";
const TEXT = "#4A4A4A";
const SUB = "#7A7A7A";
const LINE = "#EFEFEF";

const styles = {
  page: {
    width: "100%",
    height: "100%",
    background: "#fff",
    overflowY: "auto",
  },

  /* Top bar */
  topbar: {
    height: 64,
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appName: {
    fontSize: 20,
    fontWeight: 900,
    color: TEXT,
  },
  topIcons: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  iconBtn: {
    width: 32,
    height: 32,
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
  },
  iconImg: {
    width: 35,
    height: 35,
    objectFit: "contain",
    opacity: 0.85,
  },

  /* Carousel */
  carouselSection: {
    padding: "0 14px",
  },
  carousel: {
    display: "flex",
    gap: 14,
    overflowX: "auto",
    paddingBottom: 8,
  },
  recCard: {
    minWidth: 300,
    maxWidth: 300,
    borderRadius: 22,
    overflow: "hidden",
    background: PINK,
    boxShadow: "0 10px 26px rgba(0,0,0,0.12)",
  },
  recTag: {
    padding: "10px 12px",
    fontWeight: 900,
    fontSize: 13,
    color: "#fff",
  },
  recImage: {
    position: "relative",
    height: 170,
    background: "#ddd",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.08)",
  },
  starOnImage: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "none",
    background: "rgba(255,255,255,0.85)",
    fontSize: 20,
    cursor: "pointer",
  },
  recFooter: {
    padding: "12px",
    background: "rgba(0,0,0,0.08)",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
  },
  recName: {
    fontSize: 16,
    fontWeight: 900,
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  recMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.92)",
  },
  recRight: {
    textAlign: "right",
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.92)",
  },

  /* NEW */
  newSection: {
    padding: "6px 14px 16px",
    borderTop: `1px solid ${LINE}`,
  },
  newTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: TEXT,
  },
  newSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: 700,
    color: SUB,
  },
  newList: {
    marginTop: 14,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  newRow: {
    display: "grid",
    gridTemplateColumns: "68px 1fr 44px",
    gap: 12,
    alignItems: "center",
  },
  kmPill: {
    height: 44,
    borderRadius: 14,
    background: PINK,
    color: "#fff",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  newName: { fontSize: 14, fontWeight: 900, color: TEXT },
  newTime: { marginTop: 4, fontSize: 12, fontWeight: 700, color: SUB },
  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 22,
    color: PINK,
  },
};
