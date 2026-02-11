import React, { useEffect, useMemo } from "react";
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
  const kakaoId = String(
    raw.kakaoId ?? raw.kakao_id ?? raw.place_id ?? raw.placeId ?? raw.id ?? raw.pk ?? ""
  );

  const id = String(
    kakaoId ||
      raw.id ||
      raw.place_id ||
      raw.placeId ||
      raw.pk ||
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

  return { id, kakaoId, name, lat, lng, distanceKm, hours, reviews, rating };
}

/* -------------------- component -------------------- */
export default function Open24Pc() {
  const { loading, errMsg, myLoc, cafesRaw, loadOpen24 } = useOpen24State();
  const { isAuthed } = useAuth(); // eslint-disable-line no-unused-vars
  const { isBookmarked, toggle } = useBookmarks();

  // ✅ 페이지 진입 시 로드 (TTL이면 Provider가 네트워크 스킵)
  useEffect(() => {
    loadOpen24();
  }, [loadOpen24]);

  const sortedCafes = useMemo(() => {
    const normalized = cafesRaw.map((r) => normalizeCafe(r, myLoc));
    normalized.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    return normalized;
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
        ) : sortedCafes.length === 0 ? (
          <div style={styles.emptyWrap}>
            <div style={styles.emptyInner}>
              <img src={moonEmptyIcon} alt="" style={styles.emptyIconImg} />
              <div style={styles.emptyText}>지금 내 근처에는 24시 카페가 없어요!</div>
            </div>
          </div>
        ) : (
          <div style={styles.oneColumn}>
            <div style={styles.listWrap}>
              {sortedCafes.map((c) => (
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
        )}
      </section>
    </div>
  );
}

/* -------------------- UI components -------------------- */

function CafeRow({ cafe, isFav, onToggleFav, onRoute }) {
  return (
    <div style={styles.rowCard}>
      <div style={styles.rowLeft}>
        <div style={styles.rowBody}>
          <div style={styles.rowName}>{cafe.name}</div>
          <div style={styles.rowMeta}>거리 {(cafe.distanceKm ?? 0).toFixed(2)} km</div>
        </div>
      </div>

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

const BLUE = "#84DEEE";
const BLUE_DARK = "#8acfdbff";

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

  // ✅ 1컬럼 컨테이너
  oneColumn: {
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },

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

  rowBody: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-start",
    textAlign: "left",
  },
  rowName: { fontSize: 18, fontWeight: 800, color: "#4A4A4A" },
  rowMeta: { fontSize: 13, color: "#7A7A7A", fontWeight: 600 },

  rowActions: { display: "flex", gap: 10, alignItems: "center" },

  routeBtnSmall: {
    border: "none",
    background: BLUE,
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
    color: BLUE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  rowFavActive: { color: BLUE_DARK },

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
    border: `1px solid ${BLUE}`,
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
