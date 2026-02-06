// src/pages/home/mobile/HomeMobile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import logoRec from "../../../icon/logo_rec.png";
import settingsIcon from "../../../icon/Settings_gray.png";

import bakeryicon from "../../../icon/bakeryicon.png";
import drinkicon from "../../../icon/drinkicon.png";
import desserticon from "../../../icon/desserticon.png";

import { cafes } from "../cafes.js";
import { bakerys, drinks, desserts } from "../menus.js";

/* ---------------- util ---------------- */
function pick3Distinct(len) {
  if (len < 3) throw new Error("len must be >= 3");
  const s = new Set();
  while (s.size < 3) s.add(Math.floor(Math.random() * len));
  return [...s];
}

function pick2Distinct(len) {
  const a = Math.floor(Math.random() * len);
  let b = Math.floor(Math.random() * (len - 1));
  if (b >= a) b += 1;
  return [a, b];
}

export default function HomeMobile() {
  const navigate = useNavigate();

  /* (디자인 틀 유지용) recCards / newList는 useMemo 형태를 유지하되,
     실제 표시 데이터는 selected/menuPick로 채움 */
  const recCards = useMemo(() => [{ tag: "" }, { tag: "" }], []);

  /* ---------------- data state (사용자 요청: 이 내용물 유지) ---------------- */
  const [selected, setSelected] = useState([]);
  const [menuPick, setMenuPick] = useState({
    drink: null,
    dessert: null,
    bakery: null,
  });

  useEffect(() => {
    // 카페 추천 2개
    if (Array.isArray(cafes) && cafes.length >= 2) {
      const [a, b] = pick2Distinct(cafes.length);
      setSelected([cafes[a], cafes[b]]);
    }

    // 메뉴 3종(Drink/Dessert/Bakery): 서로 다른 인덱스 3개
    const minLen = Math.min(
      Array.isArray(drinks) ? drinks.length : 0,
      Array.isArray(desserts) ? desserts.length : 0,
      Array.isArray(bakerys) ? bakerys.length : 0
    );

    if (minLen >= 3) {
      const [i, j, k] = pick3Distinct(minLen);
      setMenuPick({
        drink: drinks[i],
        dessert: desserts[j],
        bakery: bakerys[k],
      });
    } else {
      setMenuPick({
        drink: Array.isArray(drinks) && drinks.length ? drinks[0] : null,
        dessert:
          Array.isArray(desserts) && desserts.length ? desserts[0] : null,
        bakery: Array.isArray(bakerys) && bakerys.length ? bakerys[0] : null,
      });
    }
  }, []);

  const getCafe = (idx) => selected[idx] || null;

  return (
    <div style={styles.page}>
      {/* Top Bar (로고/설정) */}
      <header style={styles.topbar}>
        <div style={styles.leftGroup}>
          <img src={logoRec} alt="로고" style={styles.logoImg} />

          <button
            type="button"
            style={styles.settingBtnInline}
            aria-label="설정"
            onClick={() => navigate("/settings")}
          >
            <img src={settingsIcon} alt="설정" style={styles.iconImgInline} />
          </button>
        </div>
      </header>
      {/* Recommendation carousel (카페 추천) */}
      <section style={styles.carouselSection}>
        <div style={styles.carousel}>
          {recCards.map((c, idx) => {
            const cafe = getCafe(idx);
            const imgSrc = cafe
              ? new URL(`../img/${cafe.id}.jpeg`, import.meta.url).toString()
              : null;

            return (
              <div key={idx} style={styles.recCard}>
                <div style={styles.recTag}>{c.tag}</div>

                <div style={styles.recImage}>
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={cafe?.name || "cafe"}
                      style={styles.recRealImg}
                    />
                  ) : (
                    <div style={styles.imagePlaceholder} />
                  )}
                </div>

                <div style={styles.recFooter}>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.recName}>{cafe?.name ?? ""}</div>

                    <div style={styles.recMeta}>
                      {cafe?.location ? (
                        <div style={styles.metaLine}>🗺️ {cafe.location}</div>
                      ) : null}

                      {cafe?.time ? (
                        <div style={styles.metaLine}>⏰ {cafe.time}</div>
                      ) : null}

                      {cafe?.signature ? (
                        <div style={styles.metaLine}>⭐ {cafe.signature}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.dotsWrap} aria-hidden="true">
          <span style={{ ...styles.dot, ...styles.dotActive }} />
          <span style={styles.dot} />
          <span style={styles.dot} />
          <span style={styles.dot} />
          <span style={styles.dot} />
        </div>
      </section>

      {/* (메뉴 추천) */}
      <section style={styles.eatSection}>
        <div style={styles.eatTitle}>How About This menu?</div>
        <div style={styles.eatSub}>개발팀의 메뉴 추천!</div>

        <div style={styles.eatTiles}>
          <button type="button" style={styles.tileBtn} aria-label="coffee">
            <img src={drinkicon} alt="coffee" style={styles.tileIcon} />
            <div style={styles.tileLabel}>Drink</div>
            <div style={styles.tileValue}>{menuPick.drink?.name ?? ""}</div>
          </button>

          <button type="button" style={styles.tileBtn} aria-label="cookie">
            <img src={desserticon} alt="cookie" style={styles.tileIcon} />
            <div style={styles.tileLabel}>Cookie</div>
            <div style={styles.tileValue}>{menuPick.dessert?.name ?? ""}</div>
          </button>

          <button type="button" style={styles.tileBtn} aria-label="bakery">
            <img src={bakeryicon} alt="bakery" style={styles.tileIcon} />
            <div style={styles.tileLabel}>Bakery</div>
            <div style={styles.tileValue}>{menuPick.bakery?.name ?? ""}</div>
          </button>
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

  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10, // 로고-설정 간격
  },

  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  settingBtnInline: {
    width: 32,
    height: 32,
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  iconImgInline: {
    width: 30,
    height: 30,
    objectFit: "contain",
    opacity: 0.85,
  },

  logoImg: {
    height: 45,
    width: 60,
    objectFit: "contain",
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
  recRealImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
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
    textAlign: "left",
    fontSize: 16,
    fontWeight: 900,
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  recMeta: {
    textAlign: "left",
    marginTop: 6,
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.92)",
    display: "flex",
    flexDirection: "column",
    gap: 4, // 줄 간격
  },

  metaLine: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  recRight: {
    gap: 6,
    display: "flex",
    flexDirection: "column",
    textAlign: "right",
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.92)",
  },

  dotsWrap: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    padding: "8px 0 2px",
  },
  dot: {
    width: 22,
    height: 4,
    borderRadius: 999,
    background: "rgba(0,0,0,0.12)",
  },
  dotActive: {
    background: "rgba(0,0,0,0.35)",
  },

  /* WHAT TO EAT */
  eatSection: {
    marginTop: 26,
    padding: "6px 14px 16px",
  },
  eatTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: TEXT,
  },
  eatSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: 700,
    color: SUB,
  },
  eatTiles: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  tileBtn: {
    height: 88,
    borderRadius: 18,
    border: "none",
    cursor: "pointer",
    background: "rgba(132, 222, 238, 0.55)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    boxShadow: "0 8px 18px rgba(0,0,0,0.07)",
  },
  tileIcon: {
    width: 34,
    height: 34,
    objectFit: "contain",
    display: "block",
    opacity: 0.95,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-0.01em",
    textTransform: "lowercase",
  },
  tileValue: {
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(0,0,0,0.55)",
    width: "86%",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};
