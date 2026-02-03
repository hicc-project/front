import { useEffect, useState } from "react";
import logoRec from "../../../icon/logo_rec.png";
import bakeryicon from "../../../icon/bakeryicon.png";
import drinkicon from "../../../icon/drinkicon.png";
import desserticon from "../../../icon/desserticon.png";
import { cafes } from "../cafes.js";
import { bakerys, drinks, desserts } from "../menus.js";

function pick3Distinct(len) {
  if (len < 3) throw new Error("len must be >= 3");
  const s = new Set();
  while (s.size < 3) s.add(Math.floor(Math.random() * len));
  return [...s];
}

function pick2Distinct(len) {
  const a = Math.floor(Math.random() * len);
  let b = Math.floor(Math.random() * (len - 1));
  if (b >= a) b += 1;
  return [a, b];
}

export default function HomePc() {
  const [selected, setSelected] = useState([]);

  // 메뉴 3종(Drink/Dessert/Bakery) 각각 랜덤 1개씩
  const [menuPick, setMenuPick] = useState({
    drink: null,
    dessert: null,
    bakery: null,
  });

  useEffect(() => {
    // 우측 카페 2개
    if (Array.isArray(cafes) && cafes.length >= 2) {
      const [a, b] = pick2Distinct(cafes.length);
      setSelected([cafes[a], cafes[b]]);
    }

    // 좌측 메뉴: menus.js에서 "서로 다른 인덱스 3개" 뽑아
    // 각 카테고리(drinks/desserts/bakerys)에 각각 1개씩 매핑
    const minLen = Math.min(
      Array.isArray(drinks) ? drinks.length : 0,
      Array.isArray(desserts) ? desserts.length : 0,
      Array.isArray(bakerys) ? bakerys.length : 0
    );

    if (minLen >= 3) {
      const [i, j, k] = pick3Distinct(minLen);
      setMenuPick({
        drink: drinks[i],
        dessert: desserts[j],
        bakery: bakerys[k],
      });
    } else {
      // 길이가 부족하면 각 배열에서 0번(있으면)으로 폴백
      setMenuPick({
        drink: Array.isArray(drinks) && drinks.length ? drinks[0] : null,
        dessert:
          Array.isArray(desserts) && desserts.length ? desserts[0] : null,
        bakery: Array.isArray(bakerys) && bakerys.length ? bakerys[0] : null,
      });
    }
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
          </div>

          <div className="list">
            {/* Drink */}
            <div className="menuRow">
              <div className="menuLeft">
                <img src={drinkicon} alt="drink" className="menuIcon" />
                <div className="menuLabel">Drink</div>
              </div>
              <div className="menuInputBox">{menuPick.drink?.name ?? ""}</div>
            </div>

            {/* Dessert */}
            <div className="menuRow">
              <div className="menuLeft">
                <img src={desserticon} alt="dessert" className="menuIcon" />
                <div className="menuLabel">Dessert</div>
              </div>
              <div className="menuInputBox">{menuPick.dessert?.name ?? ""}</div>
            </div>

            {/* Bakery */}
            <div className="menuRow">
              <div className="menuLeft">
                <img src={bakeryicon} alt="bakery" className="menuIcon" />
                <div className="menuLabel">Bakery</div>
              </div>
              <div className="menuInputBox">{menuPick.bakery?.name ?? ""}</div>
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

      {/* 페이지 하단에 CSS 삽입 */}
      <style>{`
  /* 좌측 메뉴(How About This Menu!) - 전체 축소 버전 */
  .list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 4px 0px 0px;
  }

  .menuRow {
    display: grid;
    grid-template-columns: 220px 1fr;  /* 좌측 폭 축소 */
    align-items: center;
    column-gap: 0px;
    padding: 12px 0px;                /* 행 높이 축소 */
    border-top: 1px solid #6a6a6a;     /* 선 두께 축소 */
  }

  .menuRow:first-child {
    border-top: none;
  }

  .menuLeft {
    display: flex;
    align-items: center;
    gap: 14px;                        /* 간격 축소 */
    padding-left: 8px;                /* 좌측 여백 축소 */
  }

  .menuIcon {
    width: 58px;                      /* 아이콘 축소 */
    height: 58px;
    object-fit: contain;
    display: block;
    flex-shrink: 0;
  }

  .menuLabel {
    font-size: 18px;                  /* 라벨 축소 */
    font-weight: 700;
    color: #111;
  }

  .menuInputBox {
    height: auto;
    background: transparent;
    border-radius: 0px;
    padding: 0 12px 0 0;              /* 우측 여백 축소 */
    display: flex;
    align-items: left;
    justify-content: flex-end;
    box-sizing: border-box;
    font-size: 16px;                  /* 메뉴명 축소 */
    font-weight: 300;
    color: #000000;
  }
`}</style>
    </div>
  );
}
