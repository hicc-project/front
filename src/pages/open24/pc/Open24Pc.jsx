import React, { useEffect, useMemo, useState } from "react";
import { openKakaoRouteToPlace } from "../../../utils/cafeApi";
import { useOpen24State } from "../../../providers/Open24StateProvider";
import { useAuth } from "../../../providers/AuthProvider";
import { useBookmarks } from "../../../providers/BookmarksProvider";
import moonEmptyIcon from "../../../icon/moon_empty.png";


/* -------------------- helpers -------------------- */
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatReviews(v) {
  if (v == null) return "0,000개";
  if (typeof v === "string") return v.includes("개") ? v : `${v}개`;
  const n = Number(v);
  if (!Number.isFinite(n)) return "0,000개";
  return `${n.toLocaleString("ko-KR")}개`;
}

function normalizeCafe(raw, myLoc) {
  const id = String(
    raw.kakaoId ??
      raw.kakao_id ??
      raw.id ??
      raw.place_id ??
      raw.placeId ??
      raw.pk ??
      `${raw.name ?? raw.place_name ?? "cafe"}-${raw.lat ?? raw.y}-${raw.lng ?? raw.x}`
  );

  const name = raw.name ?? raw.place_name ?? raw.cafe_name ?? raw.title ?? "카페이름";

  const lat = Number(raw.lat ?? raw.latitude ?? raw.y);
  const lng = Number(raw.lng ?? raw.longitude ?? raw.x);

  const distM =
    typeof raw.distM === "number"
      ? raw.distM
      : Number(raw.distance_m ?? raw.dist_m ?? raw.distance ?? raw.dist);

  let distanceKm = 9999;
  if (Number.isFinite(distM)) distanceKm = distM / 1000;
  else if (myLoc && Number.isFinite(lat) && Number.isFinite(lng)) {
    distanceKm = haversineKm(myLoc.lat, myLoc.lng, lat, lng);
  }

  const openT = raw.today_open_time ?? raw.todayOpenTime;
  const closeT = raw.today_close_time ?? raw.todayCloseTime;
  const hours = openT && closeT ? `${openT} - ${closeT}` : "00:00 - 00:00";

  const ratingNum = Number(raw.rating ?? raw.star ?? raw.score ?? raw.rate);
  const rating = Number.isFinite(ratingNum) ? ratingNum : 0;
  const reviews = formatReviews(raw.reviews ?? raw.review_count ?? raw.reviewCount);

  const imagesArr =
    raw.images ??
    raw.imageUrls ??
    raw.image_urls ??
    (raw.image_url ? [raw.image_url] : null) ??
    [];

  const images =
    Array.isArray(imagesArr) && imagesArr.length ? imagesArr : ["카페사진1", "카페사진2", "카페사진3"];

  return { id, name, lat, lng, distanceKm, hours, reviews, rating, images };
}

/* -------------------- component -------------------- */
export default function Open24Pc() {
  const { loading, errMsg, myLoc, cafesRaw, loadOpen24 } = useOpen24State();
  const { isAuthed } = useAuth();
  const { isBookmarked, toggle } = useBookmarks();

  // ✅ 페이지 진입 시 로드 (TTL이면 Provider가 네트워크 스킵)
  useEffect(() => {
    loadOpen24();
  }, [loadOpen24]);

  const onToggleBookmark = async (cafeName) => {
    try {
      await toggle(cafeName);
    } catch (e) {
      if (e?.code === "LOGIN_REQUIRED") {
        alert("즐겨찾기는 로그인 후 사용할 수 있어요.");
      } else {
        alert(e?.message || "즐겨찾기 처리 실패");
      }
    }
  };

  const { nearest, rest } = useMemo(() => {
    const normalized = cafesRaw.map((r) => normalizeCafe(r, myLoc));
    normalized.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    return { nearest: normalized[0] ?? null, rest: normalized.slice(1) };
  }, [cafesRaw, myLoc]);

  return (
    <div style={styles.page}>
      {/* Hero */}
      <header style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroTitle}>24-hour cafe</div>
          <div style={styles.heroSub}>내 근처에 24시간 동안 운영하는 카페는?</div>
        </div>
      </header>

      <section style={styles.content}>
        {loading ? (
          <div style={styles.stateBox}>불러오는 중...</div>
        ) : errMsg ? (
          <div style={styles.stateBox}>
            <div style={{ marginBottom: 10 }}>{errMsg}</div>
            <button type="button" style={styles.stateBtn} onClick={() => loadOpen24({ force: true })}>
              다시 시도
            </button>
          </div>
        ) : !nearest ? (
          <div style={styles.emptyWrap}>
            <div style={styles.emptyInner}>
              <img
                src={moonEmptyIcon}
                alt=""
                style={styles.emptyIconImg}
              />

              <div style={styles.emptyText}>지금 내 근처에는 24시 카페가 없어요!</div>
            </div>
          </div>
        ) : (
          <div style={styles.grid}>
            {/* Left: nearest */}
            <div style={styles.left}>
              <NearestCard
                cafe={nearest}
                isFav={isBookmarked(nearest.kakaoId)}
                onToggleFav={async () => {
                  try {
                    await toggle(nearest.kakaoId, nearest.name);
                  } catch (e) {
                    if (e?.code === "LOGIN_REQUIRED") alert("즐겨찾기는 로그인 후 사용할 수 있어요.");
                    else alert(e?.message || "즐겨찾기 처리 실패");
                  }
                }}
                onRoute={() => openKakaoRouteToPlace(nearest)}
              />
            </div>

            {/* Right: list */}
            <div style={styles.right}>
              <div style={styles.listWrap}>
                {rest.map((c) => (
                  <CafeRow
                    key={c.id}
                    cafe={c}
                    isFav={isBookmarked(c.kakaoId)}
                    onToggleFav={async () => {
                      try {
                        await toggle(c.kakaoId, c.name);
                      } catch (e) {
                        if (e?.code === "LOGIN_REQUIRED") alert("즐겨찾기는 로그인 후 사용할 수 있어요.");
                        else alert(e?.message || "즐겨찾기 처리 실패");
                      }
                    }}
                    onRoute={() => openKakaoRouteToPlace(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* -------------------- UI components -------------------- */

function NearestCard({ cafe, isFav, onToggleFav, onRoute }) {
  const [idx, setIdx] = useState(0);
  const images = cafe.images?.length ? cafe.images : ["카페사진1", "카페사진2", "카페사진3"];
  const current = images[idx % images.length];

  return (
    <div style={styles.nearestCard}>
      <div style={styles.nearestTopRow}>
        <div style={styles.nearestTitleRow}>
          <div style={styles.nearestName}>{cafe.name}</div>

          {/* ✅ 길찾기 + 즐겨찾기: 옆에 배치 */}
          <div style={styles.topActions}>
            <button type="button" style={styles.routeBtn} onClick={onRoute}>
              길찾기
            </button>

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
        </div>

        <div style={styles.nearestMetaRow}>
          <div style={styles.ratingRow}>
            <span style={styles.ratingLabel}>별점</span>
            <Stars value={cafe.rating || 0} />
            <span style={styles.ratingValue}>{(cafe.rating || 0).toFixed(1)}</span>
          </div>

          <div style={styles.metaRight}>
            <div style={styles.metaText}>거리 {(cafe.distanceKm ?? 0).toFixed(2)} km</div>
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

function CafeRow({ cafe, isFav, onToggleFav, onRoute }) {
  return (
    <div style={styles.rowCard}>
      <div style={styles.rowLeft}>
        <div style={styles.thumbBox}>
          <div style={styles.thumbText}>카페사진</div>
        </div>

        <div style={styles.rowBody}>
          <div style={styles.rowName}>{cafe.name}</div>
          <div style={styles.rowMeta}>거리 {(cafe.distanceKm ?? 0).toFixed(2)} km</div>
        </div>
      </div>

      {/* ✅ 리스트 쪽도 길찾기 + 별을 함께 */}
      <div style={styles.rowActions}>
        <button type="button" style={styles.routeBtnSmall} onClick={onRoute}>
          길찾기
        </button>

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

/* -------------------- styles (기존 스타일 유지 + 버튼만 추가) -------------------- */

const PINK = "#84DEEE";
const PINK_DARK = "#8acfdbff";

const styles = {
  page: {
    width: "92vw",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },

  hero: {
    height: 260,
    flexShrink: 0,
    background: "linear-gradient(180deg, #68D0E4 0%, #caebf1ff 60%, #FFFFFF 100%)",
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
  heroSub: { marginTop: 10, fontSize: 18, color: "#6B6B6B", fontWeight: 500 },



  content: { flex: 1, overflow: "hidden", padding: "18px 22px 22px 22px" },

  grid: { height: "100%", minHeight: 0, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 },

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
    flex: 1,
    minHeight: 0,
  },

  nearestTopRow: { display: "flex", flexDirection: "column", gap: 10 },

  nearestTitleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  nearestName: { fontSize: 28, fontWeight: 800, color: "#3F3F3F" },

  // 길찾기+별 묶음
  topActions: { display: "flex", gap: 10, alignItems: "center" },

  routeBtn: {
    border: "none",
    background: PINK,
    color: "#fff",
    fontWeight: 900,
    fontSize: 12,
    height: 34,
    padding: "0 14px",
    borderRadius: 18,
    cursor: "pointer",
  },

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
  favBtnActive: { background: PINK, color: "#fff", border: `1px solid ${PINK_DARK}` },

  nearestMetaRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" },
  ratingRow: { display: "flex", alignItems: "center", gap: 8 },
  ratingLabel: { fontSize: 14, color: "#5F5F5F", fontWeight: 700 },
  stars: { color: PINK, fontSize: 18, letterSpacing: 1.2 },
  ratingValue: { fontSize: 14, color: "#5F5F5F", fontWeight: 700 },

  metaRight: { display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" },
  metaText: { fontSize: 13, color: "#7A7A7A", fontWeight: 600 },

  photoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginTop: 4,
    flex: 1,
    minHeight: 0,
  },
  photoTile: {
    height: "100%",
    minHeight: 170,
    borderRadius: 14,
    border: "none",
    background: "#D9D9D9",
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: 800,
    cursor: "pointer",
  },
  photoTileActive: { background: "#CFCFCF", outline: `3px solid ${PINK}` },

  right: { minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" },

  listWrap: {
    flex: 1,
    minHeight: 0,
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

  rowBody: { minWidth: 0, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", textAlign: "left" },
  rowName: { fontSize: 18, fontWeight: 800, color: "#4A4A4A" },
  rowMeta: { fontSize: 13, color: "#7A7A7A", fontWeight: 600 },

  // ✅ 리스트 오른쪽 액션 묶음
  rowActions: { display: "flex", gap: 10, alignItems: "center" },

  routeBtnSmall: {
    border: "none",
    background: PINK,
    color: "#fff",
    fontWeight: 900,
    fontSize: 12,
    height: 30,
    padding: "0 12px",
    borderRadius: 18,
    cursor: "pointer",
  },

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

  stateBox: {
    height: "100%",
    borderRadius: 18,
    border: "1px solid #EAEAEA",
    background: "#fff",
    padding: 18,
    color: "#4A4A4A",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    flexDirection: "column",
  },
  stateBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${PINK}`,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    color: "#4A4A4A",
  },
  emptyWrap: {
  minHeight: 420,            
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 16px",
  },

  emptyInner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    opacity: 0.95,
  },

  emptyIconImg: {
    width: 64,
    height: 50,
    opacity: 0.7,
    flexShrink: 0,
  },


  emptyText: {
    fontSize: 18,
    fontWeight: 600,
    color: "#555",
  },

};
