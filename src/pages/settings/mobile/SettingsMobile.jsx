// src/pages/settings/mobile/SettingsMobile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import introduction from "../../../icon/introduction.png";
import intent from "../../../icon/intent.png";
import features from "../../../icon/features.png";
import fe from "../../../icon/fe.png";
import be from "../../../icon/be.png";
import design from "../../../icon/design.png";

export default function SettingsMobile() {
  const navigate = useNavigate();

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalKey, setInfoModalKey] = useState("");

  const footer = useMemo(
    () => [
      {
        title: "Policy 서비스 정책",
        items: [
          "이용약관",
          "개인정보 처리방침",
          "위치기반 서비스 약관",
          "책임 제한 고지",
          "저작권 정책",
        ],
      },
      {
        title: "Support 고객 지원",
        items: [
          "고객센터",
          "1:1 문의하기",
          "서비스 오류 신고",
          "개선 의견 보내기",
        ],
      },
      {
        title: "About 서비스 정보",
        items: ["서비스 소개", "기획 의도", "주요 기능"],
      },
      { title: "개발팀 소개", items: ["프론트엔드", "백엔드", "디자인"] },
    ],
    []
  );

  const policyRouteMap = useMemo(
    () => ({
      이용약관: "/policy/terms",
      "개인정보 처리방침": "/policy/privacy",
      "위치기반 서비스 약관": "/policy/location",
      "책임 제한 고지": "/policy/disclaimer",
      "저작권 정책": "/policy/copyright",
    }),
    []
  );

  const supportItems = useMemo(
    () =>
      new Set([
        "고객센터",
        "1:1 문의하기",
        "서비스 오류 신고",
        "개선 의견 보내기",
      ]),
    []
  );

  const infoModalMap = useMemo(
    () => ({
      "서비스 소개": { title: "서비스 소개", img: introduction },
      "기획 의도": { title: "기획 의도", img: intent },
      "주요 기능": { title: "주요 기능", img: features },
      프론트엔드: { title: "프론트엔드", img: fe },
      백엔드: { title: "백엔드", img: be },
      디자인: { title: "디자인", img: design },
    }),
    []
  );

  const SUPPORT_EMAIL = "c211052@g.hongik.ac.kr";

  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportTopic, setSupportTopic] = useState("");

  const onNavigate = (label) => {
    const path = policyRouteMap[label];
    if (path) {
      navigate(path);
      return;
    }

    if (supportItems.has(label)) {
      setSupportTopic(label);
      setSupportModalOpen(true);
      return;
    }

    if (infoModalMap[label]) {
      setInfoModalKey(label);
      setInfoModalOpen(true);
      return;
    }

    alert(`${label} 클릭`);
  };

  // 배너 시계
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeText = formatAmPmTime(now);

  const infoData = infoModalMap[infoModalKey];

  return (
    <div className="mSettingsPage">
      <style>{`
        .mSettingsPage{
          width:100%;
          min-height:100vh;
          background:#fff;
          overflow-x:hidden;
          overflow-y:auto;
        }

        /* ===== Header ===== */
        .mTitleWrap{
          padding:16px 16px 10px;
          text-align:left;
        }
        .mTitle{
          font-size:22px;
          font-weight:900;
          color:#4A4A4A;
          letter-spacing:0.2px;
        }
        .mSubtitle{
          margin-top:6px;
          font-size:13px;
          color:#7A7A7A;
          font-weight:700;
        }

        /* ===== Banner ===== */
        .mMain{
          padding:0 16px;
        }
        .mBanner{
          width:100%;
          border-radius:22px;
          background: linear-gradient(180deg, #84DEEE 0%, #c5f0f8ff 62%, #FFFFFF 100%);
          position:relative;
          overflow:hidden;
          padding:18px 16px 40px;
          display:flex;
          flex-direction:column;
          gap:16px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.10);
        }
        .mBannerTopRow{
          display:flex;
          align-items:center;
          gap:12px;
          color:#fff;
        }
        .mClockIcon{
          width:40px;
          height:40px;
          border-radius:999px;
          border:2px solid rgba(255,255,255,0.85);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:18px;
          flex:0 0 40px;
        }
        .mTimeText{
          font-size:30px;
          font-weight:900;
          letter-spacing:0.4px;
          color:#fff;
        }
        .mBannerCenterText{
          text-align:center;
          color:#fff;
          padding:2px 6px 0;
        }
        .mBannerLineEn{
          font-size:16px;
          font-weight:900;
          letter-spacing:0.1px;
        }
        .mBannerLineKo{
          margin-top:6px; 
          font-size:13px;
          font-weight:800;
          opacity:0.96;
        }

        /* ===== Footer grid -> Mobile accordion list ===== */
        .mFooter{
          padding:18px 16px 18px;
        }
        .mFooterGrid{
          display:flex;
          flex-direction:column;
          gap:14px;
        }
        .mFooterCol{
          border:1px solid rgba(17,17,17,0.10);
          border-radius:18px;
          overflow:hidden;
          background:rgba(255,255,255,0.86);
          box-shadow: 0 8px 20px rgba(0,0,0,0.05);
        }
        .mFooterTitle{
          padding:12px 14px;
          font-size:14px;
          font-weight:900;
          color:#4A4A4A;
          background: rgba(132, 222, 238, 0.16);
          border-bottom:1px solid rgba(17,17,17,0.08);
        }
        .mFooterList{
          display:flex;
          flex-direction:column;
          gap:0;
          padding:10px 10px 12px;
        }
        .mFooterItem{
          width:100%;
          border:none;
          background:transparent;
          text-align:left;
          cursor:pointer;
          font-size:13px;
          color:#7A7A7A;
          font-weight:700;
          padding:10px 10px;
          border-radius:12px;
          transition: background 120ms ease, color 120ms ease, transform 120ms ease;
        }
        .mFooterItem:hover{
          background: rgba(132, 222, 238, 0.14);
          color:#111;
        }
        .mFooterItem:active{
          transform: scale(0.99);
        }

        /* ===== Support Modal ===== */
        .supportModal{
          position:fixed;
          inset:0;
          z-index:9999;
        }
        .supportModalOverlay{
          position:absolute;
          inset:0;
          background: rgba(0,0,0,0.35);
        }
        .supportModalPanel{
          position:relative;
          width:min(520px, calc(100vw - 32px));
          margin:90px auto 0;
          background:#fff;
          border-radius:18px;
          padding:18px 18px 16px;
          box-shadow: 0 18px 50px rgba(0,0,0,0.18);
          overflow:hidden;
        }
        .supportModalAccent{
          position:absolute;
          inset:0 0 auto 0;
          height:92px;
          background: linear-gradient(180deg, #84deee 0%, #c5f0f8 85%, rgba(255,255,255,0) 100%);
          pointer-events:none;
        }
        .supportModalHeader{
          position:relative;
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:12px;
          padding-top:6px;
        }
        .supportModalTitle{
          font-size:18px;
          font-weight:900;
          color:#1f2937;
          text-align:left;
        }
        .supportModalSubtitle{
          margin-top:6px;
          font-size:13px;
          font-weight:700;
          color: rgba(31,41,55,0.72);
        }
        .supportModalClose{
          width:36px;
          height:36px;
          border-radius:12px;
          border:1px solid rgba(17,17,17,0.12);
          background: rgba(255,255,255,0.86);
          cursor:pointer;
          font-size:18px;
          line-height:34px;
          font-weight:900;
        }
        .supportModalBody{
          position:relative;
          margin-top:14px;
          border:1px solid rgba(17,17,17,0.10);
          background: rgba(255,255,255,0.72);
          border-radius:14px;
          padding:14px;
        }
        .supportModalEmailRow{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:12px;
          border-radius:12px;
          background: rgba(132, 222, 238, 0.18);
          border: 1px solid rgba(132, 222, 238, 0.35);
        }
        .supportModalEmail{
          font-weight:900;
          color:#0f172a;
          word-break: break-all;
        }
        .supportModalBtn{
          border:none;
          cursor:pointer;
          border-radius:12px;
          padding:10px 12px;
          font-weight:900;
          background:rgba(132, 222, 238, 0.18);
          color:#0b2a33;
          transition: transform 120ms ease, background 120ms ease;
        }
        .supportModalBtn:active{
          background: rgba(132, 222, 238, 0.32);
          transform: scale(0.97);
        }
        .supportModalHint{
          margin-top:10px;
          font-size:12px;
          color: rgba(31,41,55,0.7);
          line-height:1.6;
        }

        /* ===== Intro/Image Modal ===== */
        .introModal{
          position:fixed;
  inset:0;
  z-index:10000;
  display:flex;
  align-items:center;        /* 세로 중앙 */
  justify-content:center;    /* 가로 중앙 */
        }
        .introModalOverlay{
          position:absolute;
          inset:0;
          background: rgba(0,0,0,0.45);
        }
        .introModalPanel{
          position:relative;
          width: min(560px, calc(100vw - 28px));
          max-height: min(360px, calc(100vh - 120px));
          margin:0px auto 0;
          background:#fff;
          border-radius: 10px;
          overflow:hidden;
          box-shadow: 0 22px 70px rgba(0,0,0,0.22);
        }
        .introModalClose{
          position:absolute;
          top:12px;
          right:12px;
          width:44px;
          height:44px;
          border-radius:14px;
          border:1px solid rgba(17,17,17,0.14);
          background: rgba(255,255,255,0.90);
          cursor:pointer;
          font-size:22px;
          line-height:42px;
          font-weight:900;
          z-index:2;
        }
        .introModalBody{
          width:100%;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#fff;
        }
        .introImage{
          width:100%;
          height:100%;
          object-fit:contain;
          display:block;
        }

        /* bottom space (nav overlap) */
        .bottomSpacer{
          height:90px;
        }
      `}</style>

      {/* 상단 타이틀 */}
      <header className="mTitleWrap">
        <div className="mTitle">MY PAGE</div>
        <div className="mSubtitle">마이페이지</div>
      </header>

      {/* 배너 */}
      <main className="mMain">
        <section className="mBanner">
          <div className="mBannerTopRow">
            <div className="mClockIcon" aria-hidden="true">
              🕒
            </div>
            <div className="mTimeText">{timeText}</div>
          </div>

          <div className="mBannerCenterText">
            <div className="mBannerLineEn">
              You can find a cafe that's still open.
            </div>
            <div className="mBannerLineKo">
              이 시간에도 열려 있는 카페를 찾을 수 있어요.
            </div>
          </div>
        </section>
      </main>

      {/* 하단 메뉴(모바일은 4열 -> 세로 카드 형태) */}
      <footer className="mFooter">
        <div className="mFooterGrid">
          {footer.map((col) => (
            <div className="mFooterCol" key={col.title}>
              <div className="mFooterTitle">{col.title}</div>
              <div className="mFooterList">
                {col.items.map((it) => (
                  <button
                    key={it}
                    type="button"
                    className="mFooterItem"
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

      <div className="bottomSpacer" />

      {/* 문의 모달 */}
      {supportModalOpen && (
        <div
          className="supportModal"
          role="dialog"
          aria-modal="true"
          aria-label="문의 안내"
        >
          <div
            className="supportModalOverlay"
            onClick={() => setSupportModalOpen(false)}
          />
          <div className="supportModalPanel">
            <div className="supportModalAccent" />

            <div className="supportModalHeader">
              <div>
                <div className="supportModalTitle">{supportTopic}</div>
                <div className="supportModalSubtitle">
                  아래 이메일로 문의해 주세요.
                </div>
              </div>

              <button
                type="button"
                className="supportModalClose"
                onClick={() => setSupportModalOpen(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="supportModalBody">
              <div className="supportModalEmailRow">
                <div className="supportModalEmail">{SUPPORT_EMAIL}</div>
                <button
                  type="button"
                  className="supportModalBtn"
                  onClick={() => navigator.clipboard?.writeText(SUPPORT_EMAIL)}
                >
                  복사
                </button>
              </div>

              <div className="supportModalHint">
                제목에 문의 유형({supportTopic})을 포함해 주시면 처리 속도가
                빨라집니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 모달 */}
      {infoModalOpen && infoData && (
        <div
          className="introModal"
          role="dialog"
          aria-modal="true"
          aria-label={infoData.title}
        >
          <div
            className="introModalOverlay"
            onClick={() => setInfoModalOpen(false)}
          />
          <div className="introModalPanel">
            <button
              type="button"
              className="introModalClose"
              onClick={() => setInfoModalOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>

            <div className="introModalBody">
              <img
                className="introImage"
                src={infoData.img}
                alt={infoData.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
