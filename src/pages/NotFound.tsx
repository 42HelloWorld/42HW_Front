import BasicButton from "@utils/BasicButton";
import Loading from "@utils/Loading";
import { FC, useCallback } from "react";
import { useNavigate } from "react-router";

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
      <div>Page Not Found!</div>
      <BasicButton text="메인으로 돌아가기" onClick={onBackToMain} />
    </div>
  );
};

export default NotFound;
