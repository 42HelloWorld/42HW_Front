import { useContext } from "react";
import VoteStatusBoard from "./VoteStatusBoard";
import { CallContext } from "@contexts/CallProvider";

const WaitToast = () => {
  const { callInfo } = useContext(CallContext);

  return (
    <div>
      <div className="my-1">투표 중입니다.</div>
      {callInfo.currNum === 1 || callInfo.currNum === null ? (
        <div>통화가 종료되었습니다.</div>
      ) : (
        <VoteStatusBoard totalNum={callInfo.currNum} />
      )}
    </div>
  );
};

export default WaitToast;
