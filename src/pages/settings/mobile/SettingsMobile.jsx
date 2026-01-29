// src/pages/settings/mobile/SettingsMobile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SettingsMobile() {
  const navigate = useNavigate(); // 뒤로가기 추가

  const menuGroups = useMemo(
    () => [
      {
        key: "g1",
        items: ["내 정보", "즐겨찾기", "방문 기록", "리뷰 관리"],
      },
      {
        key: "g2",
        items: ["24시간 카페", "키워드 알림", "위치 설정"],
      },
      {
        key: "g3",
        items: ["설정", "고객센터", "로그아웃"],
      },
    ],
    []
  );

  const footer = useMemo(
    () => [
      {
        title: "Policy 서비스 정책",
        items: ["이용약관", "개인정보 처리방침", "위치기반 서비스 이용약관"],
      },
      {
        title: "Support 고객 지원",
        items: ["고객센터", "1:1 문의하기", "자주 묻는 질문(FAQ)"],
      },
      {
        title: "About 서비스 정보",
        items: ["서비스 소개", "팀 소개", "버전 정보"],
      },
    ],
    []
  );

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeText = formatAmPmTime(now);

  const onNavigate = (label) => {
    alert(`${label} 클릭`);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        {/*  백버튼 */}
        <button
          type="button"
          style={styles.backBtn}
          aria-label="뒤로가기"
          onClick={() => navigate(-1)} 
        >
          ←
        </button>

        <div style={styles.headerTitle}>MY PAGE</div>

        {/* 오른쪽 여백 맞춤용 더미 */}
        <div style={{ width: 32 }} />
      </header>

      {/* Time Banner */}
      <section style={styles.banner}>
        <div style={styles.bannerTop}>
          <div style={styles.clock}>🕒</div>
          <div style={styles.time}>{timeText}</div>
        </div>
        <div style={styles.bannerTextEn}>
          You can find a cafe that's still open.
        </div>
        <div style={styles.bannerTextKo}>
          이 시간에도 열려 있는 카페를 찾을 수 있어요.
        </div>
      </section>

      {/* Menu */}
      <main style={styles.main}>
        {menuGroups.map((g) => (
          <div key={g.key} style={styles.menuGroup}>
            {g.items.map((label) => (
              <button
                key={label}
                type="button"
                style={styles.menuItem}
                onClick={() => onNavigate(label)}
              >
                <span>{label}</span>
                <span style={styles.chevron}>›</span>
              </button>
            ))}
          </div>
        ))}

        {/* Footer links */}
        <div style={styles.footer}>
          {footer.map((col) => (
            <div key={col.title} style={styles.footerGroup}>
              <div style={styles.footerTitle}>{col.title}</div>
              {col.items.map((it) => (
                <button
                  key={it}
                  type="button"
                  style={styles.footerItem}
                  onClick={() => onNavigate(it)}
                >
                  {it}
                </button>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ---------------- utils ---------------- */

function formatAmPmTime(d) {
  let h = d.getHours();
  const m = d.getMinutes();
  const isPm = h >= 12;
  const ampm = isPm ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  const mm = String(m).padStart(2, "0");
  return `${ampm} . ${h}:${mm}`;
}

/* ---------------- styles ---------------- */

const PINK = "#84DEEE";
const PINK_SOFT = "#c5f0f8ff";
const TEXT = "#4A4A4A";
const SUB = "#7A7A7A";
const LINE = "#E9E9E9";

const styles = {
  page: {
    width: "100%",
    height: "100%",
    background: "#fff",
    overflowY: "auto",
    paddingBottom: 90, // 하단 모바일 네비 여유
  },

  header: {
    height: 56,
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${LINE}`,
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 10,
  },

  backBtn: {
    width: 32,
    height: 32,
    border: "none",
    background: "transparent",
    fontSize: 22,
    cursor: "pointer",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: TEXT,
  },

  banner: {
    margin: "14px",
    padding: "16px",
    borderRadius: 18,
    background: `linear-gradient(180deg, ${PINK} 0%, ${PINK_SOFT} 70%, #fff 100%)`,
    color: "#fff",
    textAlign: "center",
    paddingBottom: 60,
  },

  bannerTop: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  clock: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  time: {
    fontSize: 26,
    fontWeight: 900,
  },

  bannerTextEn: {
    fontSize: 14,
    fontWeight: 800,
  },

  bannerTextKo: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 700,
    opacity: 0.95,
  },

  main: {
    padding: "0 14px",
  },

  menuGroup: {
    background: "#fff",
    borderRadius: 14,
    border: `1px solid ${LINE}`,
    marginBottom: 14,
    overflow: "hidden",
  },

  menuItem: {
    width: "100%",
    height: 48,
    border: "none",
    background: "#fff",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 15,
    fontWeight: 700,
    color: TEXT,
    cursor: "pointer",
  },

  chevron: {
    fontSize: 18,
    color: SUB,
  },

  footer: {
    marginTop: 18,
  },

  footerGroup: {
    marginBottom: 14,
  },

  footerTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: TEXT,
    marginBottom: 6,
  },

  footerItem: {
    display: "block",
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "6px 0",
    fontSize: 13,
    color: SUB,
    cursor: "pointer",
  },
};
