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
  /* 좌측 메뉴 - 미니멀 글래스(그림자 축소, 내부 선 제거) */
  .list{
    display:flex;
    flex-direction:column;
    gap:10px;
    padding:10px 10px 0;
  }

  .menuRow{
    position:relative;
    display:grid;
    grid-template-columns: 220px 1fr;
    align-items:center;
    gap:14px;
    padding:12px 14px;

    border-radius:18px;
    background: rgba(255,255,255,0.62);
    border: 1px solid rgba(17,17,17,0.10);

    /* 그림자 조금 줄임 */
    box-shadow:
    0 6px 14px rgba(0,0,0,0.05),
    0 1px 3px rgba(0,0,0,0.03);

    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    overflow:hidden;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }

  /* 내부 선(상단 하이라이트 / 좌우 디바이더) 제거 */
  .menuRow::before,
  .menuRow::after{
    display:none;
    content:none;
  }

  .menuRow:hover{
    transform: translateY(-2px);
    border-color: rgba(17,17,17,0.16);
    box-shadow:
      0 8px 18px rgba(0,0,0,0.055),
    0 2px 6px rgba(0,0,0,0.035);
  }

  .menuLeft{
    display:flex;
    align-items:center;
    gap:12px;
    padding-right:10px;
    min-width:0;
  }

  /* 아이콘 58x58 고정: 주변 장식 제거 */
  .menuIcon{
    width:58px;
    height:58px;
    flex:0 0 58px;
    display:block;
    object-fit:contain;

    border:none;
    background:transparent;
    box-shadow:none;
    border-radius:0;
    padding:0;
  }

  .menuLabel{
    font-size:15px;
    font-weight:850;
    color:#101010;
    letter-spacing:-0.03em;
    line-height:1.15;
    min-width:0;

    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .menuInputBox{
    display:flex;
    margin-right:8px;
    align-items:center;
    justify-content:flex-end;
    min-width:0;
    padding-left:14px;
  }

  /* 우측 박스: 내부선(인셋) 제거 */
  .menuInputBox > *{
    max-width:100%;
    width:fit-content;

    padding:10px 12px;
    border-radius:14px;
 
    background: rgba(255,255,255,0.78);
    border: 1px solid rgba(0,0,0,0.10);

    /* 내부선 제거 + 그림자도 약하게 */
    box-shadow: 0 8px 18px rgba(0,0,0,0.05);

    font-size:14px;
    font-weight:600;
    color: rgba(0,0,0,0.72);
    letter-spacing:-0.01em;
    line-height:1.2;

    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    box-sizing:border-box;
  }

  .menuInputBox.isEmpty > *{
    color: rgba(0,0,0,0.38);
    background: rgba(0,0,0,0.03);
    box-shadow: none;
  }

  @media (max-width: 560px){
    .list{ padding:10px 8px 0; }
    .menuRow{
      grid-template-columns: 1fr;
      gap:10px;
    }
    .menuLeft{ padding-right:0; }
    .menuInputBox{
      justify-content:flex-start;
      padding-left:0;
    }
    .menuInputBox > *{
      width:100%;
    }
  }
`}</style>
    </div>
  );
}
