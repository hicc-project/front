import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import introduction from "../../../icon/introduction.png";
import intent from "../../../icon/intent.png";
import features from "../../../icon/features.png";
import fe from "../../../icon/fe.png";
import be from "../../../icon/be.png";
import design from "../../../icon/design.png";

export default function SettingsPc() {
  const navigate = useNavigate();
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalKey, setInfoModalKey] = useState(""); // 어떤 항목인지 저장

  const footer = useMemo(
    () => [
      {
        title: "Policy 서비스 정책",
        items: ["이용약관", "개인정보 처리방침", "위치기반 서비스 약관", "책임 제한 고지", "저작권 정책"],
      },
      {
        title: "Support 고객 지원",
        items: ["고객센터", "1:1 문의하기", "서비스 오류 신고", "개선 의견 보내기"],
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
    () => new Set(["고객센터", "1:1 문의하기", "서비스 오류 신고", "개선 의견 보내기"]),
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

    // ✅ 이미지 모달 대상 항목이면 모달 오픈
    if (infoModalMap[label]) {
      setInfoModalKey(label);
      setInfoModalOpen(true);
      return;
    }

    alert(`${label} 클릭`);
  };

  // (배너 시계가 필요하면 유지)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeText = formatAmPmTime(now);

  const infoData = infoModalMap[infoModalKey];

  return (
    <div className="settingsPage">
      {/* STYLE을 JSX 하단에 함께 포함 */}
      <style>{`
        .settingsPage{
          width: 90vw;
          height: 110vh;
          background:#fff;
          overflow:hidden;
          position:relative;
          display:flex;
          flex-direction:column;
        }

        .titleWrap{
          padding-top:15px;
          padding-bottom:15px;
          text-align:center;
        }
        .title{
          font-size:34px;
          font-weight:900;
          color:#4A4A4A;
          letter-spacing:0.4px;
        }
        .subtitle{
          margin-top:6px;
          font-size:16px;
          color:#7A7A7A;
          font-weight:600;
        }

        .main{
          flex:1;
          display:flex;
          justify-content:center;
          padding:0 34px;
          align-items:flex-start;
        }

        .banner{
          width:100%;
          max-width:980px;
          height:380px;
          border-radius:20px;
          background: linear-gradient(180deg, #84DEEE 0%, #c5f0f8ff 62%, #FFFFFF 100%);
          position:relative;
          overflow:hidden;
          padding:26px 28px;
          display:flex;
          flex-direction:column;
          justify-content:flex-start;
          gap:35px;
        }
        .bannerTopRow{
          display:flex;
          align-items:center;
          gap:16px;
          color:#fff;
        }
        .clockIcon{
          width:46px;
          height:46px;
          border-radius:999px;
          border:2px solid rgba(255,255,255,0.85);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:20px;
        }
        .timeText{
          font-size:40px;
          font-weight:900;
          letter-spacing:0.6px;
          color:#fff;
        }
        .bannerCenterText{
          text-align:center;
          color:#fff;
        }
        .bannerLineEn{
          font-size:28px;
          font-weight:800;
          letter-spacing:0.2px;
        }
        .bannerLineKo{
          margin-top:8px;
          font-size:22px;
          font-weight:700;
          opacity:0.95;
        }

        .footer{
          padding:28px 34px 34px 34px;
        }
        .footerGrid{
          display:grid;
          grid-template-columns:repeat(4, 1fr);
          gap:28px;
        }
        .footerTitle{
          font-size:14px;
          font-weight:900;
          color:#4A4A4A;
          margin-bottom:12px;
        }
        .footerList{
          display:flex;
          flex-direction:column;
          gap:8px;
        }
        .footerItem{
          border:none;
          background:transparent;
          text-align:center;
          cursor:pointer;
          font-size:13px;
          color:#7A7A7A;
          font-weight:600;
          padding:0;
        }
        .footerItem:hover{
          color:#111;
        }

        /* ===============================
           ✅ 문의 모달 (고객센터)
           =============================== */

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

        /* 모달 패널 */
        .supportModalPanel{
          position:relative;
          width:520px;
          max-width: calc(100vw - 32px);
          margin:90px auto 0;
          background:#fff;
          border-radius:20px;
          padding:18px 18px 16px;
          box-shadow: 0 18px 50px rgba(0,0,0,0.18);
          overflow:hidden;
        }

        /* 상단 그라데이션 (더 자연스럽게) */
        .supportModalAccent{
          position:absolute;
          inset:0 0 auto 0;
          height:110px;
          background: linear-gradient(
            180deg,
            rgba(132, 222, 238, 0.75) 0%,
            rgba(132, 222, 238, 0.45) 55%,
            rgba(132, 222, 238, 0.15) 78%,
            rgba(255,255,255,0) 100%
          );
          pointer-events:none;
        }

        /* 헤더 */
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
          font-weight:600;
          color: rgba(31,41,55,0.72);
        }

        /*  닫기 버튼 */
        .supportModalClose{
          position:absolute;
          top:-2px;
          right:-2px;
          width:33px;
          height:33px;
          background:transparent;
          border:none;
          cursor:pointer;
          padding:0;
        }

        /* X 모양 */
        .supportModalClose::before,
        .supportModalClose::after{
          content:"";
          position:absolute;
          top:50%;
          left:50%;
          width:26px;
          height:2px;
          background:#374151;
          transform-origin:center;
        }

        .supportModalClose::before{
          transform: translate(-50%, -50%) rotate(45deg);
        }
        .supportModalClose::after{
          transform: translate(-50%, -50%) rotate(-45deg);
        }

        /* 바디 */
        .supportModalBody{
          position:relative;
          margin-top:14px;
          border:1px solid rgba(17,17,17,0.10);
          background: rgba(255,255,255,0.72);
          border-radius:14px;
          padding:14px;
        }

        /* 이메일 박스 (세로폭 줄임) */
        .supportModalEmailRow{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:8px 12px;
          border-radius:12px;
          background: rgba(132, 222, 238, 0.16);
          border: 1px solid rgba(132, 222, 238, 0.3);
        }

        .supportModalEmail{
          font-weight:900;
          color:#0f172a;
          word-break: break-all;
        }

        /* 복사 버튼 */
        .supportModalBtn{
          border:none;
          cursor:pointer;
          border-radius:12px;
          padding:8px 12px;
          font-weight:900;
          background:rgba(132, 222, 238, 0.18);
          color:#0b2a33;
          transition: transform 120ms ease, background 120ms ease;
        }

        .supportModalBtn:active{
          background: rgba(132, 222, 238, 0.32);
          transform: scale(0.97);
        }

        /* 안내 문구 */
        .supportModalHint{
          margin-top:10px;
          font-size:12px;
          color: rgba(31,41,55,0.7);
          line-height:1.6;
        }

        .supportModalFooter{
          display:flex;
          justify-content:flex-end;
          gap:8px;
          margin-top:12px;
        }

        /* ✅ 이미지 모달(서비스 소개/기획의도/팀소개 등) */
        .introModal{
          position:fixed;
          inset:0;
          z-index:10000; /* supportModal(9999)보다 위 */
        }
        .introModalOverlay{
          position:absolute;
          inset:0;
          background: rgba(0,0,0,0.45);
        }
        .introModalPanel{
          position:relative;
          width:min(1120px, calc(100vw - 28px));
          height:min(780px, calc(100vh - 110px));
          margin:55px auto 0;
          align-items:center;
          justify-content:center;
          background:#fff;
          border-radius:20px;
          overflow:hidden;
          box-shadow: 0 22px 70px rgba(0,0,0,0.22);
        }
        .introModalClose{
          position:absolute;
          top:14px;
          right:14px;
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
          object-fit: content;
          display:block;
          padding:20px;
        }
      `}</style>

      <header className="titleWrap">
        <div className="title">MY PAGE</div>
        <div className="subtitle">마이페이지</div>
      </header>

      <main className="main">
        <section className="banner">
          <div className="bannerTopRow">
            <div className="clockIcon" aria-hidden="true">
              🕒
            </div>
            <div className="timeText">{timeText}</div>
          </div>

          <div className="bannerCenterText">
            <div className="bannerLineEn">You can find a cafe that's still open.</div>
            <div className="bannerLineKo">이 시간에도 열려 있는 카페를 찾을 수 있어요.</div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footerGrid">
          {footer.map((col) => (
            <div key={col.title}>
              <div className="footerTitle">{col.title}</div>
              <div className="footerList">
                {col.items.map((it) => (
                  <button key={it} type="button" className="footerItem" onClick={() => onNavigate(it)}>
                    {it}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>

      {/* ✅ 큰 문의 모달 */}
      {supportModalOpen && (
        <div className="supportModal" role="dialog" aria-modal="true" aria-label="문의 안내">
          <div className="supportModalOverlay" onClick={() => setSupportModalOpen(false)} />
          <div className="supportModalPanel">
            <div className="supportModalAccent" />

            <div className="supportModalHeader">
              <div>
                <div className="supportModalTitle">{supportTopic}</div>
                <div className="supportModalSubtitle">아래 이메일로 문의해 주세요.</div>
              </div>

              {/* ✅ 텍스트 X 제거: CSS로 X 그림 */}
              <button
                type="button"
                className="supportModalClose"
                onClick={() => setSupportModalOpen(false)}
                aria-label="닫기"
              />
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
                제목에 문의 유형({supportTopic})을 포함해 주시면 처리 속도가 빨라집니다.
              </div>

              <div className="supportModalFooter"></div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 이미지 모달 */}
      {infoModalOpen && infoData && (
        <div className="introModal" role="dialog" aria-modal="true" aria-label={infoData.title}>
          <div className="introModalOverlay" onClick={() => setInfoModalOpen(false)} />
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
              <img className="introImage" src={infoData.img} alt={infoData.title} />
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
