import { useContext } from "react";
import VoteStatusBoard from "./VoteStatusBoard";
import { CallContext } from "@contexts/CallProvider";

const WaitToast = () => {
  const { callInfo } = useContext(CallContext);

  return (
    <div>
      <div className="my-1">투표 중입니다.</div>
      {callInfo.currNum ? (
        <VoteStatusBoard totalNum={callInfo.currNum} />
      ) : (
        <div>통화가 종료되었습니다.</div>
      )}
    </div>
  );
};

export default WaitToast;
