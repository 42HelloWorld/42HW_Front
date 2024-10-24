import VoteStatus from "@components/Call/VoteStatusBoard";
import { CallContext } from "@contexts/CallProvider";
import { SocketContext } from "@contexts/SocketProvider";
import { FC, useState, useCallback, useContext } from "react";

interface Props {
  contentsName: string;
  requester: string;
}

const VoteToast: FC<Props> = ({ contentsName, requester }) => {
  const { socket } = useContext(SocketContext);
  const { callInfo } = useContext(CallContext);
  const [isVoted, setIsVoted] = useState<boolean | null>(null);

  const voteAccept = useCallback(() => {
    socket?.emit("voteAccept", {
      roomName: callInfo.roomName,
      contents: contentsName,
    });
    setIsVoted(true);
  }, [isVoted]);

  const voteReject = useCallback(() => {
    socket?.emit("voteReject", {
      roomName: callInfo.roomName,
      contents: contentsName,
    });
    setIsVoted(false);
  }, [isVoted]);

  return (
    <div className="flex flex-col justify-evenly">
      <div className="my-1">{`[${requester}] TOPIC-${contentsName} 요청`}</div>
      {callInfo.currNum === 1 || callInfo.currNum === null ? (
        <div>통화가 종료되었습니다.</div>
      ) : (
        <>
          <VoteStatus totalNum={callInfo.currNum} />
          <div className="flex justify-evenly my-1">
            {isVoted === null ? (
              <>
                <button
                  className="w-[40%] h-[30px] rounded-md bg-blue-600"
                  onClick={voteAccept}
                >
                  찬성
                </button>
                <button
                  className="w-[40%] h-[30px] rounded-md bg-gray-400"
                  onClick={voteReject}
                >
                  반대
                </button>
              </>
            ) : isVoted ? (
              <div>찬성하셨습니다.</div>
            ) : (
              <div>반대하셨습니다.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VoteToast;
