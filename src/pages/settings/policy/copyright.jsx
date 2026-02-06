// src/pages/settings/policy/copyright.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Copyright() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button type="button" style={s.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <div>
          <div style={s.title}>저작권 정책</div>
          <div style={s.meta}>시행일: 2026-02-03</div>
        </div>
      </header>

      <main style={s.body}>
        <h2 style={s.h2}>1. 권리의 귀속</h2>
        <p style={s.p}>
          서비스 내 제공되는 텍스트, UI/UX, 로고, 디자인, 데이터 편집물 등은
          서비스 제공자 또는 정당한 권리자에게 귀속됩니다.
        </p>

        <h2 style={s.h2}>2. 이용 제한</h2>
        <p style={s.p}>
          이용자는 서비스 제공자의 사전 허가 없이 서비스의 내용을 복제, 배포,
          전송, 전시, 2차적 저작물 작성 등의 방식으로 이용할 수 없습니다(법령상
          허용되는 경우 제외).
        </p>

        <h2 style={s.h2}>3. 권리 침해 신고</h2>
        <p style={s.p}>
          서비스 내 콘텐츠가 권리를 침해한다고 판단되는 경우, 아래 정보와 함께
          신고할 수 있습니다.
        </p>
        <ul style={s.ul}>
          <li style={s.li}>권리자(또는 대리인) 정보 및 연락처</li>
          <li style={s.li}>침해 주장 대상(페이지/콘텐츠) 식별 정보</li>
          <li style={s.li}>권리 보유를 소명할 수 있는 자료</li>
          <li style={s.li}>삭제/차단 요청 내용</li>
        </ul>

        <h2 style={s.h2}>4. 문의처</h2>
        <p style={s.p}>저작권 관련 문의: (C211052@g.hongik.ac.kr)</p>
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
