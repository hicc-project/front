// src/pages/settings/policy/location.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Location() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button type="button" style={s.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <div>
          <div style={s.title}>위치기반 서비스 이용약관</div>
          <div style={s.meta}>시행일: 2026-02-03</div>
        </div>
      </header>

      <main style={s.body}>
        <h2 style={s.h2}>제1조(목적)</h2>
        <p style={s.p}>
          본 약관은 서비스가 제공하는 위치기반 서비스의 이용과 관련하여 서비스
          제공자와 이용자 간 권리·의무, 책임사항을 규정합니다.
        </p>

        <h2 style={s.h2}>제2조(위치정보의 수집 방법)</h2>
        <ul style={s.ul}>
          <li style={s.li}>
            브라우저의 위치 권한 허용 시, 단말기 기반 위치정보(GPS 등)
          </li>
          <li style={s.li}>
            기타 위치추정이 가능한 정보(서비스 구현 방식에 따라 상이)
          </li>
        </ul>

        <h2 style={s.h2}>제3조(이용 목적)</h2>
        <ul style={s.ul}>
          <li style={s.li}>이용자 위치 및 시간 기준 주변 카페 추천/정렬</li>
          <li style={s.li}>이용자 위치에서 카페까지의 길찾기 정보 제공</li>
          <li style={s.li}>서비스 품질 개선 및 오류 분석(필요 최소 범위)</li>
        </ul>

        <h2 style={s.h2}>제4조(보관 및 이용기간)</h2>
        <p style={s.p}>
          서비스는 원칙적으로 위치정보를 저장하지 않고 실시간 처리할 수
          있습니다. 다만, 서비스 제공을 위해 저장이 필요한 경우 저장 항목, 보관
          기간, 파기 절차를 별도 안내합니다. (정책 확정 후 구체화 필요)
        </p>

        <h2 style={s.h2}>제5조(동의의 철회)</h2>
        <p style={s.p}>
          이용자는 언제든지 브라우저 설정 또는 기기 설정에서 위치 권한을
          해제하여 위치정보 제공 동의를 철회할 수 있습니다.
        </p>

        <h2 style={s.h2}>제6조(제3자 제공)</h2>
        <p style={s.p}>
          길찾기/지도 기능 제공을 위해 외부 지도 서비스 제공자에게 필요한 범위
          내의 정보가 제공될 수 있습니다. 제공 시 제공받는 자, 제공 항목, 목적
          등을 관련 법령에 따라 고지합니다. (사용 중인 지도 API에 맞춰 구체화)
        </p>

        <h2 style={s.h2}>제7조(문의처)</h2>
        <p style={s.p}>위치정보 관련 문의: (이메일/연락처 기재)</p>
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
