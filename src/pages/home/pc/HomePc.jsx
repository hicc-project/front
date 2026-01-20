import React from "react";
import AuthButtons from "./AuthButtons";
import logoRec from "../../../icon/logo_rec.png";

export default function HomePc() {
  return (
    <div className="page">
      <section className="hero">
        <AuthButtons />
        <img src={logoRec} alt="앱 로고" className="heroLogo" />
      </section>
      {/* 하단 콘텐츠 */}
      <section className="grid2">
        {/* 좌측 NEW */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">NEW!</div>
            <div className="panelSub">근처에 새로 생긴 카페를 즐겨보세요!</div>
          </div>

          <div className="list">
            {[
              { km: "0.3km", name: "카페이름", time: "00:00 - 00:00" },
              { km: "0.5km", name: "카페이름", time: "00:00 - 00:00" },
              { km: "1.0km", name: "카페이름", time: "00:00 - 00:00" },
              { km: "1.2km", name: "카페이름", time: "00:00 - 00:00" },
            ].map((x, idx) => (
              <div className="listRow" key={idx}>
                <div className="badge">{x.km}</div>
                <div className="listText">
                  <div className="listName">{x.name}</div>
                  <div className="listMeta">영업시간 {x.time}</div>
                </div>
                <button className="ghostBtn" aria-label="즐겨찾기">
                  ☆
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 우측 추천 */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">TODAY’S CAFE RECOMMANDATIONS!</div>
          </div>

          <div className="cardRow">
            <div className="cafeCard">
              <div className="cafeTag">✦ 오늘의 추천 카페</div>
              <div className="cafeImgPlaceholder">이미지</div>
              <div className="cafeFooter">
                <div>
                  <div className="cafeName">소과당 홍대점</div>
                  <div className="cafeMeta">영업중 11:00-22:00</div>
                </div>
                <div className="cafeRightMeta">
                  <div>0.7km</div>
                  <div>리뷰 1,929</div>
                </div>
              </div>
            </div>

            <div className="cafeCard">
              <div className="cafeTag">✦ 친구와 함께 가기</div>
              <div className="cafeImgPlaceholder">이미지</div>
              <div className="cafeFooter">
                <div>
                  <div className="cafeName">메이플런지</div>
                  <div className="cafeMeta">영업중 12:00-20:00</div>
                </div>
                <div className="cafeRightMeta">
                  <div>0.7km</div>
                  <div>리뷰 1,929</div>
                </div>
              </div>
            </div>
          </div>

          <div className="dots">
            <span className="dot dotActive" />
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      </section>
    </div>
  );
}
