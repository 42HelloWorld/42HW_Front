import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Loading from "@utils/Loading";
import BasicButton from "@utils/BasicButton";
import { SocketContext } from "@contexts/SocketProvider";
import { AuthContext } from "@contexts/AuthProvider";
import { CallContext, CallActionType } from "@contexts/CallProvider";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { COUNT, MILLISECOND } from "@utils/constant";
import { OpponentInfo } from "@typings/front";

const Waiting = () => {
  const navigate = useNavigate();
  const [matched, setMatched] = useState(false);
  const { myInfo } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { callInfo, dispatch } = useContext(CallContext);

  useEffect(() => {
    if (myInfo === null) {
      stopMicrophone();
      navigate("/main");
    }
  }, []);
  console.log(callInfo.stream);

  useEffect(() => {
    if (socket) {
      socket.on(
        "matching",
        (data: { opponent: OpponentInfo[]; roomName: string }) => {
          console.log("matching");
          setMatched(true);
          dispatch({
            type: CallActionType.SET_MATCHING,
            payload: {
              opponent: data.opponent,
              roomName: data.roomName,
            },
          });
          toast.info("매칭이 완료되었습니다.");
          setTimeout(() => {
            navigate("/call");
          }, COUNT.MATCH * MILLISECOND);
        }
      );
    }

    return () => {
      socket?.off("matching");
    };
  }, [socket, callInfo]);

  useEffect(() => {
    if (socket)
      socket.emit("register", {
        nickname: myInfo?.nickname,
        type: callInfo.roomType,
      });
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", preventClose);

    return () => {
      window.removeEventListener("beforeunload", preventClose);
    };
  }, []);

  const cancelWaiting = useCallback(() => {
    dispatch({ type: CallActionType.DEL_ALL });
    socket?.emit("unregister", {
      nickname: myInfo?.nickname,
    });
    stopMicrophone();
    navigate("/main");
  }, [callInfo]);

  const stopMicrophone = useCallback(() => {
    const tracks = callInfo.stream?.getAudioTracks();
    if (tracks) tracks[0].stop();
  }, [callInfo]);

  const preventClose = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = true;
  }, []);

  return (
    <Loading text={"상대방을 찾는 중입니다."}>
      <div className="my-auto">
        <BasicButton
          onClick={cancelWaiting}
          text="매칭 취소하기"
          disabled={matched}
        />
      </div>
    </Loading>
  );
};

export default Waiting;
