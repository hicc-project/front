// src/pages/open24/mobile/Open24Mobile.jsx
import React, { useMemo, useState } from "react";

export default function Open24Mobile() {
  const cafes = useMemo(
    () => [
      {
        id: "c1",
        name: "카페이름",
        distanceKm: 0.7,
        hours: "00:00 - 00:00",
        reviews: "0,000개",
        rating: 5.0,
        images: ["카페사진1", "카페사진2", "카페사진3"],
      },
      {
        id: "c2",
        name: "카페이름",
        distanceKm: 1.2,
        hours: "00:00 - 00:00",
        reviews: "0,000개",
        rating: 4.2,
        images: [],
      },
      {
        id: "c3",
        name: "카페이름",
        distanceKm: 1.6,
        hours: "00:00 - 00:00",
        reviews: "0,000개",
        rating: 4.0,
        images: [],
      },
      {
        id: "c4",
        name: "카페이름",
        distanceKm: 2.0,
        hours: "00:00 - 00:00",
        reviews: "0,000개",
        rating: 3.8,
        images: [],
      },
    ],
    []
  );

  const [favorites, setFavorites] = useState(() => new Set());
  const nearest = cafes[0];

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerTitle}>24-hour cafe</div>
        <div style={styles.headerSub}>내 근처에 24시간 동안 운영하는 카페는?</div>
      </header>

      {/* Nearest (상단 대표 카드) */}
      <section style={styles.section}>


        <NearestCard
          cafe={nearest}
          isFav={favorites.has(nearest.id)}
          onToggleFav={() => toggleFavorite(nearest.id)}
        />
      </section>

      {/* List */}
      <section style={{ ...styles.section, paddingBottom: 100 }}>
        <div style={styles.listHeading}>24-HOUR CAFE LIST</div>
        <div style={styles.listWrap}>
          {cafes.map((c) => (
            <CafeCard
              key={c.id}
              cafe={c}
              isFav={favorites.has(c.id)}
              onToggleFav={() => toggleFavorite(c.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/* -------------------- Components -------------------- */

function NearestCard({ cafe, isFav, onToggleFav }) {
  const [idx, setIdx] = useState(0);
  const images = cafe.images?.length ? cafe.images : ["카페사진1", "카페사진2", "카페사진3"];
  const current = images[idx % images.length];

  return (
    <div style={styles.nearestCard}>
      <div style={styles.nearestTopRow}>
        <div style={styles.nearestTitleRow}>
          <div style={styles.nearestName}>{cafe.name}</div>
          <button
            type="button"
            onClick={onToggleFav}
            aria-label="즐겨찾기"
            style={{ ...styles.favBtn, ...(isFav ? styles.favBtnActive : null) }}
            title="즐겨찾기"
          >
            {isFav ? "★" : "☆"}
          </button>
        </div>

        <div style={styles.metaStack}>
          <div style={styles.ratingRow}>
            <span style={styles.ratingLabel}>별점</span>
            <Stars value={cafe.rating || 0} />
            <span style={styles.ratingValue}>{(cafe.rating || 0).toFixed(1)}</span>
          </div>

          <div style={styles.metaText}>거리 {(cafe.distanceKm ?? 0).toFixed(1)} km</div>
          <div style={styles.metaText}>영업시간 {cafe.hours}</div>
          <div style={styles.metaText}>리뷰 {cafe.reviews}</div>
        </div>
      </div>

      {/* 이미지 선택(3칸) */}
      <div style={styles.photoRow}>
        <PhotoTile label="카페사진1" active={current === images[0]} onClick={() => setIdx(0)} />
        <PhotoTile label="카페사진2" active={current === images[1]} onClick={() => setIdx(1)} />
        <PhotoTile label="카페사진3" active={current === images[2]} onClick={() => setIdx(2)} />
      </div>
    </div>
  );
}

function CafeCard({ cafe, isFav, onToggleFav }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardRow}>
        <div style={styles.thumbBox}>
          <div style={styles.thumbText}>카페사진</div>
        </div>

        <div style={styles.cardBody}>
          {/* ✅ 우측 상단 별 */}
          <button
            type="button"
            onClick={onToggleFav}
            aria-label="즐겨찾기"
            style={{ ...styles.rowFav, ...(isFav ? styles.rowFavActive : null) }}
            title="즐겨찾기"
          >
            {isFav ? "★" : "☆"}
          </button>

          <div style={styles.cardTitleRow}>
            <div style={styles.cardName}>{cafe.name}</div>
          </div>

          <div style={styles.cardMeta}>거리 {(cafe.distanceKm ?? 0).toFixed(1)} km</div>
          <div style={styles.cardMeta}>영업시간 {cafe.hours}</div>
          <div style={styles.cardMeta}>리뷰 {cafe.reviews}</div>
        </div>
      </div>
    </div>
  );
}

function PhotoTile({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...styles.photoTile, ...(active ? styles.photoTileActive : null) }}
      aria-label={label}
    >
      {label}
    </button>
  );
}

function Stars({ value }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
  return <span style={styles.stars}>{stars}</span>;
}

/* -------------------- Styles -------------------- */

const PINK = "#84DEEE";
const PINK_DARK = "#8acfdbff";
const TEXT = "#4A4A4A";
const SUB = "#7A7A7A";
const LINE = "#E9E9E9";

const styles = {
  page: {
    width: "100%",
    height: "100%",
    background: "#fff",
    overflowY: "auto",
  },

  header: {
    padding: "18px 16px 14px 16px",
    background: "linear-gradient(180deg, #84DEEE 0%, #d1f0f6ff 70%, #FFFFFF 100%)",
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 900,
    color: TEXT,
    letterSpacing: -0.3,
    lineHeight: 1.1,
  },
  headerSub: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 700,
    color: SUB,
  },

  section: {
    padding: "14px 16px",
  },

  sectionHeading: {
    fontSize: 14,
    fontWeight: 900,
    color: "#4F4F4F",
    letterSpacing: 0.2,
  },
  sectionSub: {
    marginTop: 4,
    fontSize: 12,
    color: SUB,
    fontWeight: 700,
  },

  nearestCard: {
    marginTop: 12,
    borderRadius: 18,
    border: "1px solid #EAEAEA",
    background: "#fff",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
  },

  nearestTopRow: { display: "flex", flexDirection: "column", gap: 10 },

  nearestTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  nearestName: { fontSize: 20, fontWeight: 900, color: "#3F3F3F" },

  favBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: `1px solid ${PINK}`,
    background: "#fff",
    cursor: "pointer",
    fontSize: 20,
    color: PINK,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  favBtnActive: {
    background: PINK,
    color: "#fff",
    border: `1px solid ${PINK_DARK}`,
  },

  metaStack: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-start",
    textAlign: "left",
  },

  ratingRow: { display: "flex", alignItems: "center", gap: 8 },
  ratingLabel: { fontSize: 12, color: "#5F5F5F", fontWeight: 800 },
  stars: { color: PINK, fontSize: 14, letterSpacing: 1.2 },
  ratingValue: { fontSize: 12, color: "#5F5F5F", fontWeight: 800 },
  metaText: { fontSize: 12, color: SUB, fontWeight: 700 },

  photoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  },
  photoTile: {
    height: 110,
    borderRadius: 14,
    border: "none",
    background: "#D9D9D9",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  photoTileActive: {
    background: "#CFCFCF",
    outline: `3px solid ${PINK}`,
  },

  listHeading: {
    fontSize: 14,
    fontWeight: 900,
    color: "#4F4F4F",
    marginBottom: 10,
  },

  listWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  card: {
    position: "relative",
    borderRadius: 16,
    border: "1px solid #EAEAEA",
    background: "#fff",
    padding: 12,
    boxShadow: "0 8px 16px rgba(0,0,0,0.03)",
  },
  cardRow: {
    display: "grid",
    gridTemplateColumns: "88px 1fr",
    gap: 12,
    alignItems: "start",
  },

  thumbBox: {
    width: 88,
    height: 88,
    borderRadius: 14,
    border: `1px solid ${LINE}`,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbText: { fontSize: 12, color: "#D1D1D1", fontWeight: 900 },

  cardBody: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-start", 
    textAlign: "left",        
  },


  cardTitleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardName: { fontSize: 16, fontWeight: 900, color: TEXT, paddingRight: 44 },

  cardMeta: { fontSize: 12, color: SUB, fontWeight: 700 },

  rowFav: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 20,
    color: PINK,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowFavActive: { color: PINK_DARK },
};
