import CallButton from "@components/Call/CallButton";
import InitialScreen from "@components/Call/InitialScreen";
import Timer from "@components/Call/Timer";
import TopicModal from "@components/Call/TopicModal";
import TopicSelect from "@components/Call/TopicSelect";
import VoteToast from "@components/Call/VoteToast";
import { AudioContext } from "@contexts/AudioProvider";
import { CallActionType, CallContext } from "@contexts/CallProvider";
import { useSocket } from "@hooks/useSocket";
import { useStream } from "@hooks/useStream";
import { ITopicDTO } from "@typings/db";
import Loading from "@utils/Loading";
import MicrophoneSoundChecker from "@utils/MicrophoneSoundChecker";
import {
  SCREEN,
  ICE_SERVER,
  COUNT,
  MILLISECOND,
  SINGLE_CALL,
  GROUP_CALL,
  OPPONENT_LIST,
  TRANSLATION,
  PAGE,
} from "@utils/constant";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast, Id } from "react-toastify";
import Peer from "simple-peer";

const Call = () => {
  const { t } = useTranslation(TRANSLATION, { keyPrefix: PAGE.CALL });
  const navigate = useNavigate();
  const [opponentStatus, setOpponentStatus] = useState<boolean[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState(SCREEN.INIT);
  const [voteId, setVoteId] = useState<Id>(0);
  const [contents, setContents] = useState<any>([]);
  const { audio } = useContext(AudioContext);
  const { callInfo, dispatch } = useContext(CallContext);
  const { stream, disconnectStream } = useStream();
  const { socket } = useSocket();
  const totalNum =
    callInfo.roomType === SINGLE_CALL.TYPE
      ? SINGLE_CALL.TOTAL_NUM
      : GROUP_CALL.TOTAL_NUM;
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const timeoutId = useRef<any>(0);
  const peerRefs = useRef<Peer.Instance[]>([]);
  const peer = peerRefs.current;
  const nameListRef = useRef<HTMLDivElement>(null);

  // /call로 접근하였을 때 잘 login 화면으로 가는지?
  useEffect(() => {
    const status = [];
    if (callInfo.opponent && audio.stream)
      for (let i = 0; i < totalNum; i++) {
        if (i === callInfo.myIndex) {
          status.push(false);
          continue;
        }

        peer[i] = new Peer({
          initiator: i > callInfo.myIndex!,
          trickle: true,
          stream: audio.stream,
          config: { iceServers: ICE_SERVER },
        });
        status.push(true);
      }
    setOpponentStatus(status);
    dispatch({ type: CallActionType.SET_CURRNUM, payload: totalNum });
  }, []);

  // TODO : 좌우 반전, 마이크 mute
  useEffect(() => {
    if (peer && callInfo.opponent) {
      for (let i = 0; i < totalNum; i++) {
        if (i === callInfo.myIndex) {
          continue;
        }

        // 1. Initiator -> Signal Server 전송: Initiator일 때만?
        // 4. Receiver -> Signal Server
        peer[i].on("signal", (data) => {
          if (callInfo.opponent) {
            socket?.emit("joinSingle", {
              signal: data,
              opponentNickname: callInfo.opponent[i].opponentNickname,
              roomName: callInfo.roomName,
              // 내가 상대방 Peer 배열의 몇 번째 인덱스인가?
              // - 기존에는 callInfo.opponent[i].peerIndex를 넘겨주었는데, myIndex를 넘겨준다.
              peerIndex: callInfo.myIndex,
            });
          }
        });

        peer[i].on("stream", (currentStream) => {
          videoRefs.current[i].srcObject = currentStream;
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
          // TODO: 마지막에 한 번에 정리하는 것이 아니라 여기서 정리해주기
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

  // 2. Signal Server -> Receiver
  // 5. Signal Server -> Initiator
  const onPeerConnection = useCallback(
    (data: { signal: Peer.SignalData; peerIndex: number }) => {
      if (peer) {
        // 3. Receiver: offer 처리, answer 생성 및 시그널 발생시켜 Signal Server로 전송
        // 6. Initiator answer 생성
        // peerIndex: 상대방의 내 배열에서의 인덱스(즉, 상대방의 번호)
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
      hangUp();
    };
  }, []);

  useEffect(() => {
    let fullLength = 0;
    if (nameListRef.current) {
      let spans = nameListRef.current.firstElementChild;
      while (spans !== null) {
        if (spans instanceof HTMLElement) fullLength += spans.offsetWidth;
        spans = spans.nextElementSibling;
      }
      if (fullLength >= OPPONENT_LIST.BOX_WIDTH)
        if (nameListRef.current.parentElement) {
          const animation = document.createElement("style");
          animation.type = "text/css";
          animation.innerHTML = `
              @keyframes slide-left {
                from {
                  transform: translateX(0px);
                  transform: translateX(${OPPONENT_LIST.PADDING}px);
                }
                to {
                  transform: translateX(-${
                    fullLength + OPPONENT_LIST.PADDING - OPPONENT_LIST.BOX_WIDTH
                  }px);
                }
              }
              .animated {
                animation: slide-left 10s linear infinite
              }
            `;
          document.head.appendChild(animation);
          nameListRef.current.parentElement.classList.add("animated");
        }
    }
  }, []);

  const preventClose = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = true;
    // return "이 페이지를 벗어나면 데이터가 초기화 됩니다.";
  }, []);

  const muteToggle = useCallback(() => {
    const tracks = audio.stream?.getAudioTracks();
    if (tracks) tracks[0].enabled = !tracks[0].enabled;
    setIsMuted((prev) => !prev);
  }, [callInfo]);

  // 정상 종료(종료 버튼 및 강제 종료)
  const hangUp = useCallback(() => {
    for (let i = 0; i < totalNum; i++) {
      peer[i]?.destroy();
    }
    for (let i = 0; i < totalNum; i++) {
      peer[i]?.removeAllListeners();
    }
    console.log("hang up");
    // stopMicrophone();

    // 뒤로가기, 새로고침, 정상 종료(종료 버튼 및 강제 종료)
    socket?.emit("leaveRoom", { roomName: callInfo.roomName });
    dispatch({ type: CallActionType.DEL_ALL });
    toast.error("통화가 종료되었습니다.");
    disconnectStream();
    timeoutId.current = setTimeout(() => {
      // dispatch({ type: CallActionType.DEL_ALL });
      // socket을 끊지 않으면 백엔드에서 leaveRoom이 되지 않음
      // - 소켓을 유지하는 방법은 없는가?
      // - 소켓이 끊어질 때는 당연히 끊고, 방을 나갈 때도 소켓을 유지하면서 끊어보자
      // disconnectSocket();
      setIsMuted(true);
    }, COUNT.HANG_UP * MILLISECOND);
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
    (data: { result: boolean; contents: ITopicDTO }) => {
      toast.update(voteId, {
        type: data.result ? toast.TYPE.SUCCESS : toast.TYPE.ERROR,
        render: `투표가 ${data.result ? "가결" : "부결"}되었습니다.`,
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
          if (v && v.opponentNickname === data.nickname) {
            target = i;
          }
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
          dispatch({ type: CallActionType.SET_CURRNUM, payload: 1 });
          navigate("/main");
        }
        return copy;
      });
    },
    [callInfo, opponentStatus, socket]
  );

  const determineWidth = (width: number) => {
    if (width === OPPONENT_LIST.BOX_WIDTH) return "w-[280px]";
  };

  return socket === null ? (
    <Loading />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="h-[15%] flex flex-col justify-evenly">
        {callInfo.opponent?.map(
          (v, i) =>
            v && (
              <video
                key={`opponentVideo-${v}-${i}`}
                width={1}
                height={1}
                playsInline
                autoPlay
                muted={false}
                ref={(ref) => {
                  if (ref) {
                    videoRefs.current[i] = ref;
                  }
                }}
              />
            )
        )}
        <div
          className={`${determineWidth(
            OPPONENT_LIST.BOX_WIDTH
          )} h-full mx-auto overflow-hidden`}
        >
          <div
            style={{
              transform: `translateX(${
                callInfo.roomType === SINGLE_CALL.TYPE
                  ? 0
                  : OPPONENT_LIST.PADDING
              }px)`,
              whiteSpace: "nowrap",
              willChange: "transform",
            }}
          >
            <div className="text-center" ref={nameListRef}>
              {callInfo.opponent?.map(
                (v, i) =>
                  v && (
                    <span
                      key={`opponent-${v}-${i}`}
                      className={`text-4xl ${
                        opponentStatus[i] ? "text-black" : "text-gray-300"
                      }`}
                    >
                      {" " + v.opponentNickname + " "}
                    </span>
                  )
              )}
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
          >
            <MicrophoneSoundChecker
              stream={stream!}
              isSmallSize={true}
              bgColor="lightgray"
            />
          </CallButton>
        </div>
      </div>
      <div className="flex justify-center h-[10%]">
        <CallButton
          onClick={() => {
            // 이렇게 하면 3초를 기다리지 못함
            // 3초를 기다리고 main으로 가게 하고 싶음
            navigate("/main");
          }}
          type="hang-up"
          img="hang-up.svg"
        />
      </div>
    </div>
  );
};

export default Call;
