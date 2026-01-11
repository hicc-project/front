// src/pages/Open24.jsx
import React, { useMemo, useState } from "react";

export default function Open24Pc() {
  const cafes = useMemo(
    () => [
      {
        id: "c1",
        name: "카페이름",
        distanceKm: 0.0,
        hours: "00:00 - 00:00",
        reviews: "0,000개",
        rating: 5.0,
        images: ["카페사진1", "카페사진2", "카페사진3"],
      },
      {
        id: "c2",
        name: "카페이름",
        distanceKm: 0.0,
        hours: "00:00 - 00:00",
        reviews: "0,000개",
        rating: 0,
        images: [],
      },
      {
        id: "c3",
        name: "카페이름",
        distanceKm: 0.0,
        hours: "00:00 - 00:00",
        reviews: "0,000개",
        rating: 0,
        images: [],
      },
      {
        id: "c4",
        name: "카페이름",
        distanceKm: 0.0,
        hours: "00:00 - 00:00",
        reviews: "0,000개",
        rating: 0,
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
      {/* 상단 Hero */}
      <header style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroTitle}>24-hour cafe</div>
          <div style={styles.heroSub}>내 근처에 24시간 동안 운영하는 카페는?</div>
        </div>
      </header>

      {/* 하단 컨텐츠 */}
      <section style={styles.content}>
        <div style={styles.grid}>
          {/* 좌측: 대표 카드 */}
          <div style={styles.left}>
            <NearestCard
              cafe={nearest}
              isFav={favorites.has(nearest.id)}
              onToggleFav={() => toggleFavorite(nearest.id)}
            />
          </div>

          {/* 우측: 리스트 */}
          <div style={styles.right}>
            <div style={styles.listWrap}>
              {cafes.map((c) => (
                <CafeRow
                  key={c.id}
                  cafe={c}
                  isFav={favorites.has(c.id)}
                  onToggleFav={() => toggleFavorite(c.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------- Components -------------------- */

function NearestCard({ cafe, isFav, onToggleFav }) {
  const [idx, setIdx] = useState(0);
  const images = cafe.images?.length
    ? cafe.images
    : ["카페사진1", "카페사진2", "카페사진3"];
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

        <div style={styles.nearestMetaRow}>
          <div style={styles.ratingRow}>
            <span style={styles.ratingLabel}>별점</span>
            <Stars value={cafe.rating || 0} />
            <span style={styles.ratingValue}>{(cafe.rating || 0).toFixed(1)}</span>
          </div>

          <div style={styles.metaRight}>
            <div style={styles.metaText}>거리 {(cafe.distanceKm ?? 0).toFixed(1)} km</div>
            <div style={styles.metaText}>영업시간 {cafe.hours}</div>
            <div style={styles.metaText}>리뷰 {cafe.reviews}</div>
          </div>
        </div>
      </div>

      <div style={styles.photoRow}>
        <PhotoTile label="카페사진1" active={current === images[0]} onClick={() => setIdx(0)} />
        <PhotoTile label="카페사진2" active={current === images[1]} onClick={() => setIdx(1)} />
        <PhotoTile label="카페사진3" active={current === images[2]} onClick={() => setIdx(2)} />
      </div>
    </div>
  );
}

function CafeRow({ cafe, isFav, onToggleFav }) {
  return (
    <div style={styles.rowCard}>
      <div style={styles.rowLeft}>
        <div style={styles.thumbBox}>
          <div style={styles.thumbText}>카페사진</div>
        </div>

        <div style={styles.rowBody}>
          <div style={styles.rowName}>{cafe.name}</div>
          <div style={styles.rowMeta}>거리 {(cafe.distanceKm ?? 0).toFixed(1)} km</div>
          <div style={styles.rowMeta}>영업시간 {cafe.hours}</div>
          <div style={styles.rowMeta}>리뷰 {cafe.reviews}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleFav}
        aria-label="즐겨찾기"
        style={{ ...styles.rowFav, ...(isFav ? styles.rowFavActive : null) }}
        title="즐겨찾기"
      >
        {isFav ? "★" : "☆"}
      </button>
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

const styles = {
  page: {
    width: "92vw",
    height: "100%",          // ✅ 100vh → 100% (Layout이 높이 잡음)
    minHeight: 0,            // ✅ flex 자식 스크롤 필수
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },

  hero: {
    height: 260,
    flexShrink: 0,           // ✅ 위 영역이 줄어들지 않게
    background:
      "linear-gradient(180deg, #68D0E4 0%, #caebf1ff 60%, #FFFFFF 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroInner: { textAlign: "center", padding: "0 16px" },
  heroTitle: {
    fontSize: 56,
    fontWeight: 800,
    color: "#4A4A4A",
    letterSpacing: -0.5,
    lineHeight: 1.05,
  },
  heroSub: {
    marginTop: 10,
    fontSize: 18,
    color: "#6B6B6B",
    fontWeight: 500,
  },

  content: {
    flex: 1,
    minHeight: 0,            // ✅ 여기 필수!
    overflow: "hidden",
    padding: "18px 22px 22px 22px",
  },

  grid: {
    height: "100%",
    minHeight: 0,            // ✅ grid 안에서 스크롤 자식 쓰려면 안전하게
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: 24,
  },

  left: {
    minWidth: 0,
    minHeight: 0,
    borderRight: "2px solid #E9E9E9",
    paddingRight: 22,
    display: "flex",
    flexDirection: "column",
  },

  nearestCard: {
    marginTop: 18,
    borderRadius: 18,
    border: "1px solid #EAEAEA",
    background: "#fff",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
  },

  nearestTopRow: { display: "flex", flexDirection: "column", gap: 10 },

  nearestTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  nearestName: { fontSize: 28, fontWeight: 800, color: "#3F3F3F" },

  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: `1px solid ${PINK}`,
    background: "#fff",
    cursor: "pointer",
    fontSize: 22,
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

  nearestMetaRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    alignItems: "start",
  },

  ratingRow: { display: "flex", alignItems: "center", gap: 8 },
  ratingLabel: { fontSize: 14, color: "#5F5F5F", fontWeight: 700 },
  stars: { color: PINK, fontSize: 18, letterSpacing: 1.2 },
  ratingValue: { fontSize: 14, color: "#5F5F5F", fontWeight: 700 },

  metaRight: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },
  metaText: { fontSize: 13, color: "#7A7A7A", fontWeight: 600 },

  photoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginTop: 4,
  },
  photoTile: {
    height: 170,
    borderRadius: 14,
    border: "none",
    background: "#D9D9D9",
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: 800,
    cursor: "pointer",
  },
  photoTileActive: {
    background: "#CFCFCF",
    outline: `3px solid ${PINK}`,
  },

  right: {
    minWidth: 0,
    minHeight: 0,            // ✅ 여기 필수!
    display: "flex",
    flexDirection: "column",
  },

  listWrap: {
    flex: 1,                 // ✅ 남는 높이 전부 사용
    minHeight: 0,            // ✅ overflowY 작동 필수
    overflowY: "auto",
    paddingRight: 6,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  rowCard: {
    borderRadius: 16,
    border: "1px solid #EAEAEA",
    background: "#fff",
    padding: 16,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    boxShadow: "0 10px 20px rgba(0,0,0,0.03)",
  },

  rowLeft: { display: "flex", gap: 14, minWidth: 0 },

  thumbBox: {
    width: 120,
    height: 92,
    borderRadius: 14,
    border: "1px solid #E6E6E6",
    background: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbText: { fontSize: 12, color: "#D1D1D1", fontWeight: 800 },

  rowBody: { minWidth: 0, display: "flex", flexDirection: "column", gap: 6 },
  rowName: { fontSize: 18, fontWeight: 800, color: "#4A4A4A" },
  rowMeta: { fontSize: 13, color: "#7A7A7A", fontWeight: 600 },

  rowFav: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 22,
    color: PINK,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  rowFavActive: { color: PINK_DARK },
};
