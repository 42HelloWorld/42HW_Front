import { SocketContext } from "@contexts/SocketProvider";
import { CallActionType, CallContext } from "@contexts/CallProvider";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { useNavigate } from "react-router";
import CallButton from "@components/Call/CallButton";
import Timer from "@components/Call/Timer";
import MicrophoneSoundChecker from "@utils/MicrophoneSoundChecker";
import InitialScreen from "@components/Call/InitialScreen";
import TopicSelect from "@components/Call/TopicSelect";
import {
  SCREEN,
  ICE_SERVER,
  COUNT,
  MILLISECOND,
  SINGLE_CALL,
  GROUP_CALL,
  OPPONENT_LIST,
} from "@utils/constant";
import { toast, Id } from "react-toastify";
import VoteToast from "@components/Call/VoteToast";
import TopicModal from "@components/Call/TopicModal";
import Loading from "@utils/Loading";
import "@styles/Main.css";

const Call = () => {
  const navigate = useNavigate();
  const [opponentStatus, setOpponentStatus] = useState<boolean[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState(SCREEN.INIT);
  const [voteId, setVoteId] = useState<Id>(0);
  const [contents, setContents] = useState<any>([]);
  const { callInfo, dispatch } = useContext(CallContext);
  const { socket, setSocket } = useContext(SocketContext);
  const videos = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
  ];
  const timeoutId = useRef<any>(0);
  const peerRef = useRef<Peer.Instance[]>([]);
  const peer = peerRef.current;
  const totalNum =
    callInfo.roomType === SINGLE_CALL.TYPE
      ? SINGLE_CALL.TOTAL_NUM - 1
      : GROUP_CALL.TOTAL_NUM - 1;
  const divRef = useRef<HTMLDivElement>(null);

  // /call로 접근하였을 때 잘 login 화면으로 가는지?
  useEffect(() => {
    const status = [];
    if (callInfo.opponent && callInfo.stream)
      for (let i = 0; i < totalNum; i++) {
        peer[i] = new Peer({
          initiator: callInfo.opponent[i].initiator,
          trickle: true,
          stream: callInfo.stream,
          config: { iceServers: ICE_SERVER },
        });
        status.push(true);
      }
    setOpponentStatus(status);
    dispatch({ type: CallActionType.SET_CURRNUM, payload: totalNum + 1 });
  }, []);

  // TODO : 좌우 반전, 마이크 mute
  useEffect(() => {
    if (peer && callInfo.opponent) {
      for (let i = 0; i < totalNum; i++) {
        peer[i].on("signal", (data) => {
          if (callInfo.opponent)
            socket?.emit("joinSingle", {
              signal: data,
              opponentNickname: callInfo.opponent[i].opponentNickname,
              roomName: callInfo.roomName,
              peerIndex: callInfo.opponent[i].peerIndex,
            });
        });

        peer[i].on("stream", (currentStream) => {
          videos[i].current!.srcObject = currentStream;
        });

        // TODO : error 예외 처리
        peer[i].on("error", (err) => {
          console.log(err);
          setOpponentStatus((prev) => {
            const copy = prev.map((v) => v);
            copy[i] = false;
            return copy;
          });
          console.log("opponent left");
        });

        peer[i].on("close", () => {
          console.log("Peer 연결이 종료되었습니다.");
        });

        peer[i].on("data", (data) => console.log(data));
      }

      socket?.on("peerConnection", onPeerConnection);
    }

    return () => {
      socket?.off("peerConnection", onPeerConnection);
    };
  }, [socket]);

  const onPeerConnection = useCallback(
    (data: { signal: Peer.SignalData; peerIndex: number }) => {
      if (peer) {
        peer[data.peerIndex].signal(data.signal);
      }
    },
    [socket]
  );

  useEffect(() => {
    socket?.on("vote", onVote);
    socket?.on("voteResult", onVoteResult);
    socket?.on("voteFail", onVoteFail);
    socket?.on("socketDisconnect", onSocketDisconnect);

    return () => {
      socket?.off("vote", onVote);
      socket?.off("voteResult", onVoteResult);
      socket?.off("voteFail", onVoteFail);
      socket?.off("socketDisconnect", onSocketDisconnect);
    };
  }, [voteId, callInfo]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, []);

  useEffect(() => {
    // 잘못된 접근했을 때
    if (callInfo.roomName === null) {
      navigate("/main");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", preventClose);

    return () => {
      window.removeEventListener("beforeunload", preventClose);
      stopMicrophone();
      // 뒤로가기, 새로고침, 정상 종료(종료 버튼 및 강제 종료)
      socket?.disconnect();
      setSocket(null);
      dispatch({ type: CallActionType.DEL_ALL });
    };
  }, []);

  useEffect(() => {
    let length = 0;
    if (divRef.current) {
      let spans = divRef.current.firstElementChild;
      while (spans != null) {
        if (spans instanceof HTMLElement) {
          length += spans.offsetWidth;
        }
        spans = spans.nextElementSibling;
      }
      if (length >= OPPONENT_LIST.BOX_WIDTH)
        if (divRef.current.parentElement) {
          const animation = document.createElement("style");
          animation.type = "text/css";
          animation.innerHTML = `
              @keyframes slide-left {
                from {
                  transform: translateX(${OPPONENT_LIST.PADDING}px);
                }
                to {
                  transform: translateX(-${
                    length + OPPONENT_LIST.PADDING - OPPONENT_LIST.BOX_WIDTH
                  }px);
                }
              }
              .animated {
                animation: slide-left 10s linear infinite
              }
            `;
          document.head.appendChild(animation);
          divRef.current.parentElement.classList.add("animated");
        }
    }
  }, []);

  const preventClose = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = true;
  }, []);

  const muteToggle = useCallback(() => {
    const tracks = callInfo.stream?.getAudioTracks();
    if (tracks) tracks[0].enabled = !tracks[0].enabled;
    setIsMuted((prev) => !prev);
  }, [callInfo]);

  // 정상 종료(종료 버튼 및 강제 종료)
  const hangUp = useCallback(() => {
    for (let i = 0; i < totalNum; i++) peer[i]?.destroy();
    for (let i = 0; i < totalNum; i++) peer[i]?.removeAllListeners();
    console.log("hang up");
    stopMicrophone();
    setIsMuted(true);
    navigate("/");
  }, [callInfo]);

  const stopMicrophone = useCallback(() => {
    const tracks = callInfo.stream?.getAudioTracks();
    if (tracks) tracks[0].stop();
  }, [callInfo]);

  const openTopicSelect = useCallback(() => {
    setScreen(SCREEN.TOPIC_SELECT);
  }, []);

  const closeTopicSelect = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      if (!contents.length) {
        setScreen(SCREEN.INIT);
      } else setScreen(SCREEN.TOPIC_MODAL);
    }, 200);
  }, [contents]);

  const onVote = useCallback(
    (data: { contentsName: string; requester: string }) => {
      const id = toast.info(
        <VoteToast
          contentsName={data.contentsName}
          requester={data.requester}
        />,
        {
          autoClose: (COUNT.VOTE - COUNT.DIFF) * MILLISECOND,
          hideProgressBar: false,
        }
      );
      setVoteId(id);
    },
    [socket, opponentStatus]
  );

  const onVoteResult = useCallback(
    // TODO : contents type 지정하기
    // TODO : 찬성 반대 몇 표인지 나타내기
    (data: { result: boolean; contents: any }) => {
      toast.update(voteId, {
        type: data.result ? toast.TYPE.SUCCESS : toast.TYPE.ERROR,
        render: data.result
          ? "투표가 가결되었습니다."
          : "투표가 부결되었습니다.",
        autoClose: COUNT.DEFAULT * MILLISECOND,
        isLoading: false,
        hideProgressBar: true,
      });
      if (data.result) {
        setContents(data.contents);
        setIsOpen(false);
        setScreen(SCREEN.TOPIC_MODAL);
      }
    },
    [voteId]
  );

  const onVoteFail = useCallback(() => {
    toast.error("시간 초과로 투표가 부결되었습니다.");
  }, []);

  const onSocketDisconnect = useCallback(
    (data: { nickname: string }) => {
      let target = 0;

      if (callInfo.opponent)
        callInfo.opponent.forEach((v, i) => {
          if (v.opponentNickname === data.nickname) target = i;
        });

      dispatch({
        type: CallActionType.SET_CURRNUM,
        payload: callInfo.currNum! - 1,
      });

      setOpponentStatus((prev) => {
        const copy = prev.map((v) => v);
        copy[target] = false;
        let closed = true;
        for (let i = 0; i < copy.length; i++) {
          if (copy[i]) {
            closed = false;
            break;
          }
        }
        if (closed) {
          // 혼자 남은 경우 종료
          toast.error("통화가 종료되었습니다.");
          dispatch({ type: CallActionType.SET_CURRNUM, payload: 1 });
          timeoutId.current = setTimeout(() => {
            dispatch({ type: CallActionType.DEL_ALL });
            socket?.disconnect();
            setSocket(null);
            hangUp();
          }, COUNT.HANG_UP * MILLISECOND);
        }
        return copy;
      });
    },
    [callInfo, opponentStatus, socket]
  );

  return socket === null ? (
    <Loading />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full h-[15%] flex flex-col justify-evenly">
        {callInfo.opponent?.map((v, i) => (
          <video
            key={`opponentVideo-${v}-${i}`}
            width={1}
            height={1}
            playsInline
            autoPlay
            muted={false}
            ref={videos[i]}
          />
        ))}
        <div
          className={`w-[${OPPONENT_LIST.BOX_WIDTH}px] h-full mx-auto overflow-hidden`}
        >
          <div
            style={{
              transform: `translateX(${OPPONENT_LIST.PADDING}px)`,
              whiteSpace: "nowrap",
              willChange: "transform",
            }}
          >
            <div className="text-center" ref={divRef}>
              {callInfo.opponent?.map((v, i) => (
                <span
                  key={`opponent-${v}-${i}`}
                  className={`text-4xl ${
                    opponentStatus[i] ? "text-black" : "text-gray-300"
                  }`}
                >
                  {" " + v.opponentNickname + " "}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Timer />
      </div>
      <div className="h-[65%] w-full flex flex-col justify-center">
        <div className="h-[75%] w-[95%] overflow mx-auto">
          {screen === SCREEN.INIT && <InitialScreen />}
          {screen === SCREEN.TOPIC_SELECT && (
            <TopicSelect
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              setVoteId={setVoteId}
            />
          )}
          {screen === SCREEN.TOPIC_MODAL && <TopicModal contents={contents} />}
        </div>
        <div className="grid grid-cols-3 max-w-[300px] h-[25%] w-full mx-auto">
          <CallButton
            onClick={
              screen === SCREEN.TOPIC_SELECT
                ? closeTopicSelect
                : openTopicSelect
            }
            text={screen === SCREEN.TOPIC_SELECT ? "return" : "topic"}
            img={screen === SCREEN.TOPIC_SELECT ? "return.svg" : "topic.svg"}
            disabled={!opponentStatus && screen === SCREEN.INIT}
          />
          <CallButton
            onClick={() => {
              // peer?.send("hello");
            }}
            text="game"
            img="game.svg"
            disabled={!opponentStatus}
          />
          <CallButton
            onClick={muteToggle}
            clicked={isMuted}
            text={isMuted ? "mute off" : "mute"}
            img={isMuted ? "mute.svg" : "mute-off.svg"}
            children={<MicrophoneSoundChecker />}
          />
        </div>
      </div>
      <div className="flex justify-center h-[10%]">
        <CallButton onClick={hangUp} type="hang-up" img="hang-up.svg" />
      </div>
    </div>
  );
};

export default Call;
