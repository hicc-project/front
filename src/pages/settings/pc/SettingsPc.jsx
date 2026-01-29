// src/pages/Setting.jsx
import React, { useEffect, useMemo, useState } from "react";

export default function SettingPc() {
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
        items: [
          "이용약관",
          "개인정보 처리방침",
          "위치기반 서비스 이용약관",
          "청소년 보호 정책",
          "책임 제한 고지",
          "저작권 정책",
        ],
      },
      {
        title: "Support 고객 지원",
        items: [
          "고객센터",
          "1:1 문의하기",
          "자주 묻는 질문(FAQ)",
          "공지사항",
          "서비스 오류 신고",
          "개선 의견 보내기",
        ],
      },
      {
        title: "About 서비스 정보",
        items: [
          "서비스 소개",
          "기획 의도",
          "주요 기능",
          "팀 소개",
          "업데이트 내역",
          "버전 정보",
        ],
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
    // 프로젝트 라우터에 맞게 변경:
    // 예) navigate("/favorites")
    // 예) if(label==="즐겨찾기") navigate("/favorites");
    alert(`${label} 클릭`);
  };

  return (
    <div style={styles.page}>
      {/* title */}
      <header style={styles.titleWrap}>
        <div style={styles.title}>MY PAGE</div>
        <div style={styles.subtitle}>마이페이지</div>
      </header>

      {/* main */}
      <main style={styles.main}>
        {/* left menu */}
        <aside style={styles.menuCard}>
          {menuGroups.map((g, gi) => (
            <div key={g.key} style={styles.menuGroup}>
              {g.items.map((label) => (
                <button
                  key={label}
                  type="button"
                  style={styles.menuItem}
                  onClick={() => onNavigate(label)}
                >
                  {label}
                </button>
              ))}
              {gi !== menuGroups.length - 1 && (
                <div style={styles.menuDivider} />
              )}
            </div>
          ))}
        </aside>

        {/* center banner */}
        <section style={styles.banner}>
          <div style={styles.bannerTopRow}>
            <div style={styles.clockIcon} aria-hidden="true">
              🕒
            </div>
            <div style={styles.timeText}>{timeText}</div>
          </div>

          <div style={styles.bannerCenterText}>
            <div style={styles.bannerLineEn}>
              You can find a cafe that's still open.
            </div>
            <div style={styles.bannerLineKo}>
              이 시간에도 열려 있는 카페를 찾을 수 있어요.
            </div>
          </div>
        </section>
      </main>

      {/* footer */}
      <footer style={styles.footer}>
        <div style={styles.footerGrid}>
          {footer.map((col) => (
            <div key={col.title} style={styles.footerCol}>
              <div style={styles.footerTitle}>{col.title}</div>
              <div style={styles.footerList}>
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
            </div>
          ))}
        </div>
      </footer>
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
    width: "90vw",
    height: "110vh",
    background: "#fff",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  titleWrap: {
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: 900,
    color: TEXT,
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: SUB,
    fontWeight: 600,
  },

  main: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 26,
    padding: "0 34px",
    alignItems: "start",
  },

  menuCard: {
    border: "1px solid #E3E3E3",
    borderRadius: 10,
    background: "#fff",
    padding: "14px 10px",
  },
  menuGroup: {
    display: "flex",
    flexDirection: "column",
  },
  menuItem: {
    border: "none",
    background: "transparent",
    textAlign: "left",
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    color: TEXT,
    borderRadius: 8,
  },
  menuDivider: {
    height: 1,
    background: LINE,
    margin: "10px 8px",
  },

  banner: {
    height: 380,
    borderRadius: 20,
    background: `linear-gradient(180deg, ${PINK} 0%, ${PINK_SOFT} 62%, #FFFFFF 100%)`,
    position: "relative",
    overflow: "hidden",
    padding: "26px 28px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 35,
  },

  bannerTopRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    color: "#fff",
  },
  clockIcon: {
    width: 46,
    height: 46,
    borderRadius: 999,
    border: "2px solid rgba(255,255,255,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  timeText: {
    fontSize: 40,
    fontWeight: 900,
    letterSpacing: 0.6,
    color: "#fff",
  },

  bannerCenterText: {
    textAlign: "center",
    color: "#fff",
  },
  bannerLineEn: { fontSize: 28, fontWeight: 800, letterSpacing: 0.2 },
  bannerLineKo: { marginTop: 8, fontSize: 22, fontWeight: 700, opacity: 0.95 },

  footer: {
    padding: "28px 34px 34px 34px",
  },
  footerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 28,
  },
  footerCol: { minWidth: 0 },
  footerTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: TEXT,
    marginBottom: 12,
  },
  footerList: { display: "flex", flexDirection: "column", gap: 8 },
  footerItem: {
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 13,
    color: SUB,
    fontWeight: 600,
    padding: 0,
  },
};
