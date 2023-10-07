import BasicButton from "@utils/BasicButton";
import { FC, useCallback } from "react";
import { useNavigate } from "react-router";
import Loading from "@utils/Loading";
import gif404 from "@/icon/404.gif"
import "@/styles/NotFound.css"

interface Props {
  isLoading: boolean;
}

const NotFound: FC<Props> = ({ isLoading }) => {
  const navigate = useNavigate();
  const onBackToMain = useCallback(() => {
    navigate("/main");
  }, []);

  return isLoading ? (
    <Loading />
  ) : (
    <div className="w-full h-full">
      <div id="not-found-cont">
        <div id="found-title">
          <h2>Ooph!</h2>
        </div>
        <div id="contant">
          <div id="img-cont">
            <div id="img-404">
              <img src={gif404} />
            </div>
          </div>
          <div id="info">
          <h2>404</h2>
          <p>Page Not Found~</p>
          </div>
        </div>
        <div id="tail">
          <div id="butten-cont">
            <BasicButton text="메인으로 돌아가기" onClick={onBackToMain} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
