import { useEffect, useState } from "react";
import logoRec from "../../../icon/logo_rec.png";
import bakeryicon from "../../../icon/bakeryicon.png";
import drinkicon from "../../../icon/drinkicon.png";
import desserticon from "../../../icon/desserticon.png";
import { cafes } from "../cafes.js";

function pick2Distinct(len) {
  const a = Math.floor(Math.random() * len);
  let b = Math.floor(Math.random() * (len - 1));
  if (b >= a) b += 1;
  return [a, b];
}

export default function HomePc() {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!Array.isArray(cafes) || cafes.length < 2) return;
    const [a, b] = pick2Distinct(cafes.length);
    setSelected([cafes[a], cafes[b]]);
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <img src={logoRec} alt="앱 로고" className="heroLogo" />
      </section>

      {/* 하단 콘텐츠 */}
      <section className="grid2">
        {/* 좌측 NEW */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">How About This Menu!</div>
            <div className="panelSub"> 이 메뉴는 어떤가요! </div>
          </div>

          <div className="list">
            <div classname="threeblocks">
              <img src={drinkicon} alt="음료" className="threeicons" />
              <div>녹차라떼</div>
            </div>
            <div classname="threeblocks">
              <img src={bakeryicon} alt="제빵" className="threeicons" />
              <div>앙버터</div>
            </div>
            <div classname="threeblocks">
              <img src={desserticon} alt="디저트" className="threeicons" />
              <div>당근케이크</div>
            </div>
          </div>
        </div>

        {/* 우측 추천 */}
        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">OUR TEAM'S CAFE RECOMMANDATION!</div>
          </div>

          <div className="cardRow">
            {selected.map((cafe) => (
              <div className="cafeCard" key={cafe.id}>
                <div className="cafeTag">{cafe.tag}</div>

                <div className="cafeImgPlaceholder">
                  <img
                    src={new URL(
                      `../img/${cafe.id}.jpeg`,
                      import.meta.url
                    ).toString()}
                    alt={cafe.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>

                <div className="cafeFooter">
                  <div className="cafeInfo">
                    <div className="cafeName">{cafe.name}</div>

                    <div className="cafeLocation" title={cafe.location}>
                      🗺️ {cafe.location}
                    </div>

                    <div className="cafeMetaRow">
                      <div className="cafeMeta">⏰ {cafe.time}</div>
                      {cafe.signature ? (
                        <div className="cafeMeta">⭐ {cafe.signature}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
