// src/pages/settings/policy/terms.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button type="button" style={s.backBtn} onClick={() => navigate(-1)}>
          ←
        </button>
        <div>
          <div style={s.title}>이용약관</div>
          <div style={s.meta}>시행일: 2026-02-03</div>
        </div>
      </header>

      <main style={s.body}>
        <h2 style={s.h2}>제1조(목적)</h2>
        <p style={s.p}>
          본 약관은 LateCafe(이하 “서비스”)의 이용과 관련하여 서비스 제공자와
          이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을
          목적으로 합니다.
        </p>

        <h2 style={s.h2}>제2조(정의)</h2>
        <ul style={s.ul}>
          <li style={s.li}>
            “이용자”란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을
            말합니다.
          </li>
          <li style={s.li}>
            “회원”이란 로그인/회원가입을 통해 계정을 생성하고 즐겨찾기 기능 등을
            이용하는 자를 말합니다.
          </li>
          <li style={s.li}>
            “즐겨찾기”란 이용자가 관심 카페를 저장하여 목록으로 관리하는 기능을
            말합니다.
          </li>
          <li style={s.li}>
            “위치기반 기능”이란 이용자의 브라우저 위치정보를 활용하여 주변
            카페를 추천·정렬하거나 길찾기 정보를 제공하는 기능을 말합니다.
          </li>
        </ul>

        <h2 style={s.h2}>제3조(약관의 효력 및 변경)</h2>
        <p style={s.p}>
          서비스 제공자는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수
          있으며, 변경 시 서비스 내 공지 또는 기타 합리적인 방법으로 안내합니다.
        </p>

        <h2 style={s.h2}>제4조(서비스의 제공)</h2>
        <ul style={s.ul}>
          <li style={s.li}>주변 카페 검색 및 영업시간 기반 정렬</li>
          <li style={s.li}>카페 상세정보 제공</li>
          <li style={s.li}>
            이용자 위치~카페 길찾기 정보 제공(지도/길찾기 제공사 연동 가능)
          </li>
          <li style={s.li}>회원 대상 즐겨찾기 저장/조회</li>
        </ul>

        <h2 style={s.h2}>제5조(회원가입 및 계정 관리)</h2>
        <p style={s.p}>
          회원은 서비스가 정한 절차에 따라 계정을 생성할 수 있습니다. 회원은
          계정정보를 최신으로 유지해야 하며, 계정 도용 또는 부정 이용이 의심되는
          경우 즉시 서비스 제공자에게 알려야 합니다.
        </p>

        <h2 style={s.h2}>제6조(이용자의 의무)</h2>
        <ul style={s.ul}>
          <li style={s.li}>타인의 권리 침해 또는 법령 위반 행위 금지</li>
          <li style={s.li}>서비스의 정상 운영을 방해하는 행위 금지</li>
          <li style={s.li}>
            부정한 방법으로 데이터 수집/스크래핑/자동화 접근 금지(허용된 범위
            제외)
          </li>
        </ul>

        <h2 style={s.h2}>제7조(책임 제한 및 면책)</h2>
        <p style={s.p}>
          카페 영업시간, 위치, 기타 정보는 제3자 제공 정보 또는 사업자 제공 정보
          등을 기반으로 하며 실제와 다를 수 있습니다. 길찾기 결과는 지도/길찾기
          제공사의 정책과 데이터에 따라 달라질 수 있습니다. 서비스 제공자는 관련
          법령이 허용하는 범위에서 서비스 이용으로 인한 손해에 대한 책임을
          제한합니다.
        </p>

        <h2 style={s.h2}>제8조(분쟁 해결)</h2>
        <p style={s.p}>
          서비스와 관련하여 분쟁이 발생할 경우 상호 성실히 협의하며, 협의가
          어려운 경우 관련 법령에 따릅니다.
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
  ul: { marginTop: 8, paddingLeft: 18 },
  li: { marginTop: 6 },
};
