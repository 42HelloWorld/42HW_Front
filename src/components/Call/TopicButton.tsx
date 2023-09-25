import { useCallback, useContext, FC, SetStateAction } from "react";
import { toast, Id } from "react-toastify";
import WaitToast from "@components/Call/WaitToast";

import { SocketContext } from "@contexts/SocketProvider";
import { CallContext } from "@contexts/CallProvider";
import { AuthContext } from "@contexts/AuthProvider";
import { COUNT, MILLISECOND, SINGLE_CALL, GROUP_CALL } from "@utils/constant";

interface Props {
  text: string;
  img: string;
  setVoteId: React.Dispatch<SetStateAction<Id>>;
}

const TopicButton: FC<Props> = ({ text, img, setVoteId }) => {
  const { socket } = useContext(SocketContext);
  const { callInfo } = useContext(CallContext);
  const { myInfo } = useContext(AuthContext);
  const callType =
    callInfo.roomType === SINGLE_CALL.TYPE ? SINGLE_CALL : GROUP_CALL;

  const chooseContents = useCallback(() => {
    socket?.emit(
      "chooseContents",
      {
        contents: text,
        roomName: callInfo.roomName,
        requester: myInfo?.nickname,
        voteTime: COUNT.VOTE * MILLISECOND,
      },
      (result: boolean) => {
        if (result) {
          const id = toast.info(<WaitToast callType={callType} />, {
            autoClose: (COUNT.VOTE - COUNT.DIFF) * MILLISECOND,
          });
          setVoteId(id);
        } else toast.warning("이미 투표가 진행중입니다!");
      }
    );
  }, []);

  return (
    <div className="mx-auto flex items-center">
      <div>
        <button
          className={`w-16 h-16 rounded-full flex justify-center items-center ${
            text === "" ? "bg-gray-100" : "bg-orange-100 hover:bg-orange-300"
          }`}
          onClick={chooseContents}
          disabled={text === ""}
        >
          <img className="w-8 h-8" src={img} alt="hang-up" />
        </button>
        {text && <div className="text-center">{text}</div>}
      </div>
    </div>
  );
};

export default TopicButton;
