// src/pages/settings/policy/disclaimer.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Disclaimer() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button type="button" style={s.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <div>
          <div style={s.title}>책임 제한 고지</div>
          <div style={s.meta}>시행일: 2026-02-03</div>
        </div>
      </header>

      <main style={s.body}>
        <p style={s.p}>
          본 고지는 서비스 이용과 관련하여 정보 제공의 성격 및 책임의 범위를
          안내하기 위한 것입니다.
        </p>

        <h2 style={s.h2}>1. 정보의 정확성</h2>
        <p style={s.p}>
          서비스에서 제공하는 카페 영업시간, 위치, 연락처, 운영 상태 등의 정보는
          제3자 제공 정보 또는 사업자 제공 정보 등을 기반으로 하며, 실제와 다를
          수 있습니다.
        </p>

        <h2 style={s.h2}>2. 길찾기 기능</h2>
        <p style={s.p}>
          길찾기 결과는 지도/길찾기 제공사의 데이터 및 정책에 따라 달라질 수
          있으며, 교통 상황, 도로 통제, 위치 오차 등으로 실제 경로와 차이가
          발생할 수 있습니다.
        </p>

        <h2 style={s.h2}>3. 이용자 판단 책임</h2>
        <p style={s.p}>
          서비스는 참고용 정보를 제공하며, 이용자는 제공된 정보를 바탕으로
          스스로 판단하여 서비스를 이용해야 합니다.
        </p>

        <h2 style={s.h2}>4. 책임 제한</h2>
        <p style={s.p}>
          서비스 제공자는 관련 법령이 허용하는 범위에서, 서비스 이용 또는 제공
          정보의 오류로 인해 발생한 손해에 대해 책임을 제한합니다.
        </p>
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
};
