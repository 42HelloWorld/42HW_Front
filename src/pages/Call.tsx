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
} from "@utils/constant";
import { toast, Id } from "react-toastify";
import VoteToast from "@components/Call/VoteToast";
import TopicModal from "@components/Call/TopicModal";
import Loading from "@utils/Loading";

const Call = () => {
  const navigate = useNavigate();
  const [opponentStatus, setOpponentStatus] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState(SCREEN.INIT);
  const [voteId, setVoteId] = useState<Id>(0);
  const [contents, setContents] = useState<any>([]);
  const { callInfo, dispatch } = useContext(CallContext);
  const { socket } = useContext(SocketContext);
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
  const callType =
    callInfo.roomType === SINGLE_CALL.TYPE ? SINGLE_CALL : GROUP_CALL;

  // /call로 접근하였을 때 잘 login 화면으로 가는지?
  useEffect(() => {
    if (callInfo.opponent && callInfo.stream)
      for (let i = 0; i < totalNum; i++) {
        peer[i] = new Peer({
          initiator: callInfo.opponent[i].initiator,
          trickle: true,
          stream: callInfo.stream,
          config: { iceServers: ICE_SERVER },
        });
      }
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

        peer[i].on("error", (err) => {
          console.log(err);
          setOpponentStatus(false);
          console.log("opponent left");
        });

        peer[i].on("close", () => {
          console.log("Peer 연결이 종료되었습니다.");
          toast.error(
            "상대방이 연결을 종료하였습니다. 메인 화면으로 돌아갑니다."
          );
          setOpponentStatus(false);
          timeoutId.current = setTimeout(() => {
            hangUp();
          }, COUNT.HANG_UP * MILLISECOND);
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

    return () => {
      socket?.off("vote", onVote);
      socket?.off("voteResult", onVoteResult);
      socket?.off("voteFail", onVoteFail);
    };
  }, [voteId]);

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
    };
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

  const hangUp = useCallback(() => {
    for (let i = 0; i < totalNum; i++) peer[i]?.destroy();
    for (let i = 0; i < totalNum; i++) peer[i]?.removeAllListeners();
    socket?.emit("leaveRoom", {});
    console.log("hang up");
    stopMicrophone();
    setIsMuted(true);
    navigate("/");
  }, [callInfo]);

  const stopMicrophone = useCallback(() => {
    const tracks = callInfo.stream?.getAudioTracks();
    if (tracks) tracks[0].stop();
    dispatch({ type: CallActionType.DEL_ALL });
  }, [callInfo]);

  const openTopicSelect = useCallback(() => {
    setScreen(SCREEN.TOPIC_SELECT);
  }, []);

  const closeTopicSelect = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setScreen(SCREEN.INIT);
    }, 300);
  }, []);

  const onVote = useCallback(
    (data: { contentsName: string; requester: string }) => {
      const id = toast.info(
        <VoteToast
          contentsName={data.contentsName}
          requester={data.requester}
          callType={callType}
        />,
        { autoClose: (COUNT.VOTE - COUNT.DIFF) * MILLISECOND }
      );
      setVoteId(id);
    },
    [socket]
  );

  const onVoteResult = useCallback(
    // TODO : contents type 지정하기
    (data: { result: boolean; contents: any }) => {
      toast.update(voteId, {
        type: data.result ? toast.TYPE.SUCCESS : toast.TYPE.ERROR,
        render: data.result ? "성공" : "실패",
        autoClose: COUNT.DEFAULT * MILLISECOND,
        isLoading: false,
      });
      if (data.result) {
        setContents(data.contents);
        setScreen(SCREEN.TOPIC_MODAL);
      }
    },
    [voteId]
  );

  const onVoteFail = useCallback(() => {
    toast.error("실패");
  }, []);

  return callInfo.roomName === null ? (
    <Loading />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="h-[15%] flex flex-col justify-evenly">
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
        <div className="text-4xl">
          {callInfo.opponent?.map((v) => v.opponentNickname).join(" ")}
        </div>
        <Timer opponentStatus={opponentStatus} />
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
