// src/pages/settings/policy/privacy.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button type="button" style={s.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <div>
          <div style={s.title}>개인정보 처리방침</div>
          <div style={s.meta}>시행일: 2026-02-03</div>
        </div>
      </header>

      <main style={s.body}>
        <p style={s.p}>
          LateCafe(이하 “서비스”)는 개인정보보호 관련 법령을 준수하며, 이용자의
          개인정보를 안전하게 처리합니다. 본 방침은 서비스에서 제공하는 기능 및
          데이터 처리 방식에 따라 변경될 수 있습니다.
        </p>

        <h2 style={s.h2}>1. 수집하는 개인정보 항목</h2>
        <ul style={s.ul}>
          <li style={s.li}>
            계정/로그인 식별정보: 이메일 또는 소셜 로그인 식별자(서비스 구현
            방식에 따라 상이)
          </li>
          <li style={s.li}>
            서비스 이용 기록: 접속 로그, 기기/브라우저 정보(보안·운영 목적)
          </li>
          <li style={s.li}>
            즐겨찾기 데이터: 이용자가 저장한 카페 목록(계정과 연계되어 저장되는
            경우)
          </li>
          <li style={s.li}>
            위치정보: 브라우저 권한을 통해 제공되는 위치(주변 카페
            추천/정렬/길찾기 제공 시)
          </li>
        </ul>

        <h2 style={s.h2}>2. 개인정보의 수집·이용 목적</h2>
        <ul style={s.ul}>
          <li style={s.li}>회원 식별 및 즐겨찾기 기능 제공</li>
          <li style={s.li}>
            이용자 위치 및 시간 기준 주변 카페 추천/정렬 제공
          </li>
          <li style={s.li}>길찾기 기능 제공(지도/길찾기 제공사 연동 포함)</li>
          <li style={s.li}>
            서비스 안정성 확보, 오류 분석, 보안 및 부정 이용 방지
          </li>
        </ul>

        <h2 style={s.h2}>3. 보유 및 이용 기간</h2>
        <p style={s.p}>
          개인정보는 원칙적으로 목적 달성 시 지체 없이 파기합니다. 다만, 관련
          법령에 따라 보관이 필요한 경우 해당 기간 동안 보관 후 파기합니다.
          (실제 보관기간 정책을 확정하여 기재)
        </p>

        <h2 style={s.h2}>4. 제3자 제공 및 처리위탁</h2>
        <p style={s.p}>
          서비스는 길찾기/지도 제공을 위해 외부 지도 API를 사용할 수 있습니다.
          이 경우 제공 항목, 제공받는 자, 제공 목적, 보유기간 등을 관련 법령에
          따라 고지·동의 절차로 안내합니다. (사용 중인 지도/분석/로그 SDK에 맞춰
          구체화 필요)
        </p>

        <h2 style={s.h2}>5. 이용자의 권리</h2>
        <ul style={s.ul}>
          <li style={s.li}>개인정보 열람, 정정, 삭제, 처리정지 요구</li>
          <li style={s.li}>동의 철회(계정 삭제/탈퇴 포함)</li>
          <li style={s.li}>위치정보 제공 동의 철회(브라우저 설정/권한 관리)</li>
        </ul>

        <h2 style={s.h2}>6. 안전성 확보 조치</h2>
        <p style={s.p}>
          접근 통제, 권한 관리, 암호화 적용(해당 시), 로그 모니터링 등 합리적인
          안전조치를 시행합니다.
        </p>

        <h2 style={s.h2}>7. 문의처</h2>
        <p style={s.p}>개인정보 관련 문의: (이메일/연락처/담당부서 기재)</p>
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#fff", padding: "18px 18px 40px" },
  header: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    borderBottom: "1px solid #eee",
    paddingBottom: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1px solid #e5e5e5",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: "40px",
  },
  title: { fontSize: 18, fontWeight: 900, color: "#222" },
  meta: { marginTop: 6, fontSize: 12, color: "#666", fontWeight: 600 },
  body: {
    maxWidth: 920,
    margin: "0 auto",
    color: "#222",
    fontSize: 14,
    lineHeight: 1.7,
  },
  h2: { marginTop: 18, fontSize: 15, fontWeight: 900 },
  p: { marginTop: 8, marginBottom: 0 },
  ul: { marginTop: 8, paddingLeft: 18 },
  li: { marginTop: 6 },
};
