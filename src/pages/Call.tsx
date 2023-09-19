import { AuthContext } from "@contexts/AuthProvider";
import { SocketContext } from "@contexts/SocketProvider";
import { StreamActionType, StreamContext } from "@contexts/StreamProvider";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { useNavigate } from "react-router";
import CallButton from "@components/Call/CallButton";
import Timer from "@components/Call/Timer";
import MicrophoneSoundChecker from "@utils/MicrophoneSoundChecker";
import InitialScreen from "@components/Call/InitialScreen";
import TopicSelect from "@components/Call/TopicSelect";
import { SCREEN, ICE_SERVER, COUNT, MILLISECOND } from "@utils/constant";
import { toast, Id } from "react-toastify";
import VoteToast from "@components/Call/VoteToast";

const Call = () => {
  const navigate = useNavigate();
  const [opponentStatus, setOpponentStatus] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState(SCREEN.INIT);
  const [voteId, setVoteId] = useState<Id>(0);
  const { myInfo } = useContext(AuthContext);
  const { streamInfo, dispatch } = useContext(StreamContext);
  const { socket } = useContext(SocketContext);
  const opponentVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance>(
    streamInfo.stream &&
      new Peer({
        initiator: streamInfo.initiator,
        trickle: true,
        stream: streamInfo.stream,
        config: { iceServers: ICE_SERVER },
      })
  );
  const peer = peerRef.current;

  // TODO : 좌우 반전, 마이크 mute
  useEffect(() => {
    if (peer) {
      peer.on("signal", (data) => {
        socket?.emit("joinSingle", {
          signal: data,
          name: myInfo?.nickname,
          roomName: streamInfo.roomName,
        });
      });

      peer.on("stream", (currentStream) => {
        if (opponentVideo.current)
          //   // if ("srcObject" in opponentVideo.current)
          opponentVideo.current.srcObject = currentStream;
        // else
        // opponentVideo.current.src =
        // window.URL.createObjectURL(currentStream);
      });

      peer.on("error", (err) => {
        console.log(err);
        setOpponentStatus(false);
        console.log("opponent left");
      });

      peer.on("close", () => {
        console.log("Peer 연결이 종료되었습니다.");
        toast.error(
          "상대방이 연결을 종료하였습니다. 메인 화면으로 돌아갑니다."
        );
        setOpponentStatus(false);
        setTimeout(() => {
          hangUp();
        }, COUNT.HANG_UP * MILLISECOND);
      });

      peer.on("data", (data) => console.log(data));

      socket?.on("peerConnection", onPeerConnection);
    }

    return () => {
      socket?.off("peerConnection", onPeerConnection);
    };
  }, [socket]);

  useEffect(() => {
    socket?.on("vote", onVote);
    socket?.on("voteResult", onVoteResult);

    return () => {
      socket?.off("vote", onVote);
      socket?.off("voteResult", onVoteResult);
    };
  }, [voteId]);

  useEffect(() => {
    if (peer === null) {
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
    const tracks = streamInfo.stream?.getAudioTracks();
    if (tracks) tracks[0].enabled = !tracks[0].enabled;
    setIsMuted((prev) => !prev);
  }, [streamInfo]);

  const hangUp = useCallback(() => {
    peer?.destroy();
    peer?.removeAllListeners();
    socket?.emit("leaveRoom", {});
    console.log("hang up");
    stopMicrophone();
    setIsMuted(true);
    navigate("/");
  }, [streamInfo]);

  const stopMicrophone = useCallback(() => {
    const tracks = streamInfo.stream?.getAudioTracks();
    if (tracks) tracks[0].stop();
    dispatch({ type: StreamActionType.DEL_ALL });
  }, [streamInfo]);

  const openTopicSelect = useCallback(() => {
    setScreen(SCREEN.TOPIC_SELECT);
  }, []);

  const closeTopicSelect = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setScreen(SCREEN.INIT);
    }, 300);
  }, []);

  const onPeerConnection = useCallback(
    (data: { signal: Peer.SignalData }) => {
      if (peer) peer.signal(data.signal);
    },
    [socket]
  );

  const onVote = useCallback(
    (data: { contentsName: string; requester: string }) => {
      const id = toast.info(
        <VoteToast
          contentsName={data.contentsName}
          requester={data.requester}
        />,
        { autoClose: COUNT.VOTE * MILLISECOND }
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
        autoClose: COUNT.READY * MILLISECOND,
        isLoading: false,
      });
    },
    [voteId]
  );

  // TODO : 한 명이라도 시간 초과가 되었을 때, 백엔드에서 새로운 소켓 이벤트 호출

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="h-[15%] flex flex-col justify-evenly">
        <video
          width={1}
          height={1}
          playsInline
          autoPlay
          muted={false}
          ref={opponentVideo}
        />
        <div className="text-4xl">{streamInfo.opponentNickname}</div>
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
              peer?.send("hello");
            }}
            text="game"
            img="game.svg"
            disabled={!opponentStatus}
          />
          <CallButton
            onClick={muteToggle}
            clicked={isMuted}
            text={isMuted ? "mute off" : "mute"}
            img={isMuted ? "mute-off.svg" : "mute.svg"}
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
