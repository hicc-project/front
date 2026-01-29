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
  const kakaoId =
    raw.kakaoId ?? raw.kakao_id ?? raw.place_id ?? raw.placeId ?? raw.id ?? raw.pk ?? null;

  const id =
    String(
      kakaoId ??
        `${raw.name ?? raw.place_name ?? "cafe"}-${raw.lat ?? raw.y}-${raw.lng ?? raw.x}`
    );

  const name = raw.name ?? raw.place_name ?? raw.cafe_name ?? raw.title ?? "카페이름";

  const lat = Number(raw.lat ?? raw.latitude ?? raw.y);
  const lng = Number(raw.lng ?? raw.longitude ?? raw.x);

  const distM =
    typeof raw.distM === "number"
      ? raw.distM
      : Number(raw.distance_m ?? raw.dist_m ?? raw.distance ?? raw.dist);

  let distanceKm;
  if (Number.isFinite(distM)) distanceKm = distM / 1000;
  else if (myLoc && Number.isFinite(lat) && Number.isFinite(lng)) {
    distanceKm = haversineKm(myLoc.lat, myLoc.lng, lat, lng);
  } else distanceKm = 9999;

  const hours = raw.hours ?? raw.open_hours ?? raw.opening_hours ?? raw.time ?? "00:00 - 00:00";
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
    Array.isArray(imagesArr) && imagesArr.length
      ? imagesArr
      : ["카페사진1", "카페사진2", "카페사진3"];

  const placeForRoute = {
    kakaoId: kakaoId ?? id,
    name,
    lat,
    lng,
  };

  return { id, kakaoId: kakaoId ?? id, name, lat, lng, distanceKm, hours, reviews, rating, images, placeForRoute };
}

/* -------------------- page -------------------- */
export default function Open24Mobile() {
  const { loading, errMsg, myLoc, cafesRaw, loadOpen24 } = useOpen24State();
  const { isAuthed } = useAuth();
  const { isBookmarked, toggle } = useBookmarks();

  useEffect(() => {
    loadOpen24();
  }, [loadOpen24]);

  const { nearest, rest } = useMemo(() => {
    const normalized = cafesRaw.map((r) => normalizeCafe(r, myLoc));
    normalized.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    return {
      nearest: normalized[0] ?? null,
      rest: normalized.length > 1 ? normalized.slice(1) : [],
    };
  }, [cafesRaw, myLoc]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerTitle}>24-hour cafe</div>
        <div style={styles.headerSub}>내 근처에 24시간 동안 운영하는 카페는?</div>
      </header>

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
              <img src={moonEmptyIcon} alt="" style={styles.emptyIconImg} />
              <div style={styles.emptyText}>지금 내 근처에는 24시 카페가 없어요!</div>
            </div>
          </div>
      ) : (
        <>
          <section style={styles.section}>
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
              onRoute={() => openKakaoRouteToPlace(nearest.placeForRoute)}
            />
          </section>

          <section style={{ ...styles.section, paddingBottom: 100 }}>
            <div style={styles.listHeading}>24-HOUR CAFE LIST</div>
            <div style={styles.listWrap}>
              {rest.map((c) => (
                <CafeCard
                  key={c.id}
                  cafe={c}
                  isFav={isBookmarked(c.kakaoId)}
                  onToggleFav={async () => {
                    try {
                      await toggle(c.kakaoId,  c.name);
                    } catch (e) {
                      if (e?.code === "LOGIN_REQUIRED") alert("즐겨찾기는 로그인 후 사용할 수 있어요.");
                      else alert(e?.message || "즐겨찾기 처리 실패");
                    }
                  }}
                  onRoute={() => openKakaoRouteToPlace(c.placeForRoute)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* -------------------- Components -------------------- */

function NearestCard({ cafe, isFav, onToggleFav, onRoute }) {
  const [idx, setIdx] = useState(0);
  const images = cafe.images?.length ? cafe.images : ["카페사진1", "카페사진2", "카페사진3"];
  const current = images[idx % images.length];

  return (
    <div style={styles.nearestCard}>
      <div style={styles.nearestTopRow}>
        <div style={styles.nearestTitleRow}>
          <div style={styles.nearestName}>{cafe.name}</div>

          {/* ✅ 길찾기 + 즐겨찾기 */}
          <div style={styles.nearestActions}>
            <button type="button" style={styles.routeBtnSmall} onClick={onRoute}>
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

        <div style={styles.metaStack}>
          <div style={styles.ratingRow}>
            <span style={styles.ratingLabel}>별점</span>
            <Stars value={cafe.rating || 0} />
            <span style={styles.ratingValue}>{(cafe.rating || 0).toFixed(1)}</span>
          </div>

          <div style={styles.metaText}>거리 {(cafe.distanceKm ?? 0).toFixed(2)} km</div>
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

function CafeCard({ cafe, isFav, onToggleFav, onRoute }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardRow}>
        <div style={styles.thumbBox}>
          <div style={styles.thumbText}>카페사진</div>
        </div>

        <div style={styles.cardBody}>
          {/* ✅ 모바일은 absolute 영역에 "길찾기 + 즐겨찾기" 같이 */}
          <div style={styles.actionsAbs}>
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

          <div style={styles.cardTitleRow}>
            <div style={styles.cardName}>{cafe.name}</div>
          </div>

          <div style={styles.cardMeta}>거리 {(cafe.distanceKm ?? 0).toFixed(2)} km</div>
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

/* -------------------- Styles (기존 스타일 유지 + 액션 컨테이너만 추가) -------------------- */

const PINK = "#84DEEE";
const PINK_DARK = "#8acfdbff";
const TEXT = "#4A4A4A";
const SUB = "#7A7A7A";

const styles = {
  page: { width: "100%", height: "100%", background: "#fff", overflowY: "auto" },

  header: {
    padding: "18px 16px 14px 16px",
    background: "linear-gradient(180deg, #84DEEE 0%, #d1f0f6ff 70%, #FFFFFF 100%)",
    textAlign: "center",
  },
  headerTitle: { fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: -0.3, lineHeight: 1.1 },
  headerSub: { marginTop: 8, fontSize: 13, fontWeight: 700, color: SUB },

  reloadBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${PINK}`,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    color: TEXT,
  },

  section: { padding: "14px 16px" },
  listHeading: { fontSize: 14, fontWeight: 900, color: "#4F4F4F", letterSpacing: 0.2, marginBottom: 10 },
  listWrap: { display: "flex", flexDirection: "column", gap: 12 },

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

  nearestTitleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  nearestName: { fontSize: 20, fontWeight: 900, color: "#3F3F3F" },

  nearestActions: { display: "flex", gap: 8, alignItems: "center" },

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
  favBtnActive: { background: PINK, color: "#fff", border: `1px solid ${PINK_DARK}` },

  metaStack: { display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start", textAlign: "left" },
  metaText: { fontSize: 12, color: SUB, fontWeight: 700 },

  ratingRow: { display: "flex", alignItems: "center", gap: 8 },
  ratingLabel: { fontSize: 12, color: SUB, fontWeight: 800 },
  stars: { color: PINK, fontSize: 16, letterSpacing: 1.2 },
  ratingValue: { fontSize: 12, color: SUB, fontWeight: 800 },

  photoRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  photoTile: {
    height: 110,
    borderRadius: 14,
    border: "none",
    background: "#D9D9D9",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  photoTileActive: { background: "#CFCFCF", outline: `3px solid ${PINK}` },

  // 카드 리스트
  card: { borderRadius: 18, border: "1px solid #EAEAEA", background: "#fff", padding: 12 },
  cardRow: { display: "flex", gap: 12 },

  thumbBox: {
    width: 86,
    height: 86,
    borderRadius: 16,
    background: "#D9D9D9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  thumbText: { fontWeight: 900, color: "#fff", fontSize: 12 },

  cardBody: { position: "relative", flex: 1, minWidth: 0, textAlign: "left" },

  // ✅ (길찾기+별) absolute 컨테이너
  actionsAbs: {
    position: "absolute",
    top: 0,
    right: 0,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },

  routeBtnSmall: {
    border: "none",
    background: PINK,
    color: "#fff",
    fontWeight: 900,
    fontSize: 12,
    height: 28,
    padding: "0px 12px",
    borderRadius: 18,
    cursor: "pointer",
  },

  rowFav: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: `1px solid ${PINK}`,
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
    color: PINK,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  rowFavActive: { background: PINK, color: "#fff", border: `1px solid ${PINK_DARK}` },

  cardTitleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingRight: 98 },
  cardName: {
    fontSize: 16,
    fontWeight: 900,
    color: "#3F3F3F",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardMeta: { marginTop: 4, fontSize: 12, color: SUB, fontWeight: 700, lineHeight: 1.35 },

  stateBox: {
    margin: "14px 16px",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: 16,
    color: TEXT,
    fontWeight: 800,
    textAlign: "center",
  },
  stateBtn: {
    marginTop: 10,
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${PINK}`,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    color: TEXT,
  },
  emptyWrap: {
  flex: 1,
  minHeight: 340,           // 모바일 중앙정렬 영역
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "28px 16px",
  },

  emptyInner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    opacity: 0.95,
  },

  emptyIconImg: {
    width: 56,
    height: 44,
    opacity: 0.7,
    flexShrink: 0,
  },

  emptyText: {
    fontSize: 15,
    fontWeight: 700,
    color: "#555",
    lineHeight: 1.35,
  },

};
