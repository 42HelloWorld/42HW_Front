import { useCallback, useEffect, useState } from "react";
import i18n from "i18n";
import { LANG, LANGLIST } from "@utils/constant";

const LangSelect = () => {
  const [langList, setLangList] = useState<string[]>([]);

  useEffect(() => {
    const curr = localStorage.getItem("lang") === LANG.KR ? LANG.KR : LANG.EN;
    setLangList(curr === LANG.KR ? LANGLIST.KR : LANGLIST.EN);
  }, []);

  const setSystemLanguage = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const target = e.target as HTMLSelectElement;
      if (target.value === "한국어" || target.value === "Korean") {
        localStorage.setItem("lang", LANG.KR);
        i18n.changeLanguage(LANG.KR).then().catch();
        setLangList(LANGLIST.KR);
      } else {
        localStorage.setItem("lang", LANG.EN);
        i18n.changeLanguage(LANG.EN).then().catch();
        setLangList(LANGLIST.EN);
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-[30%] justify-between">
      <div id="cont-profile">
        <div id="title">언어 설정</div>
        <div id="board" >
          <div id="line-dashed">
            <div id="board-select">
              <span>배울 언어</span>
              <select disabled>
                {["영어"].map((v, i) => (
                  <option key={`배울 언어-${i}`}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div id="line-dashed">
            <div id="board-select">
              <span>시스템 언어</span>
              <select
                value={
                  localStorage.getItem("lang") === LANG.KR ? "한국어" : "영어"
                }
                onChange={setSystemLanguage}
              >
                {langList.map((v, i) => (
                  <option key={`시스템 언어-${i}`}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LangSelect;
