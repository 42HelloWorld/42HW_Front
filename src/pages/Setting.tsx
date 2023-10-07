import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SocketContext } from "@contexts/SocketProvider";
import { AuthContext } from "@contexts/AuthProvider";
import { CallContext, CallActionType } from "@contexts/CallProvider";
import { toast } from "react-toastify";
import BasicButton from "@utils/BasicButton";
import MicrophoneSoundChecker from "@utils/MicrophoneSoundChecker";
import { MIC_STATUS, SINGLE_CALL } from "@utils/constant";
import Loading from "@utils/Loading";
import { useTranslation } from "react-i18next";

const Setting = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDone, setIsDone] = useState(false);
  const [micStatus, setMicStatus] = useState(MIC_STATUS.DENIED);
  const { myInfo } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { callInfo, dispatch } = useContext(CallContext);
  const streamArray = useRef<MediaStream[]>([]);
  const prevStatus = useRef<string>("prompt");

  useEffect(() => {
    // 잘못된 접근했을 때
    if (myInfo === null || socket === null) {
      stopAllStreams();
      navigate("/main");
    }
  }, []);

  // 크롬에서는 원래 거부되었을 경우 : denied
  // 사파리에서는 denied -> prompt 로 바뀌기 때문에 2번 출력
  useEffect(() => {
    getUserMedia();
    // console.log(micStatus);
    // console.log(isDone);
  }, [micStatus, socket]);

  useEffect(() => {
    const id = setInterval(() => {
      pollMicAvailable();
    }, 300);

    return () => {
      clearInterval(id);
    };
  }, []);

  // denied와 allow / not allow는 다른 것
  // allow / not allow는 prompt 상태
  const pollMicAvailable = async () => {
    const permissionName = "microphone" as PermissionName;
    const result = await navigator.permissions.query({ name: permissionName });
    if (prevStatus.current !== result.state) {
      if (result.state === "denied")
        toast.error("마이크 권한을 허용해 주세요!");
      setMicStatus(result.state);
    }
    prevStatus.current = result.state;
  };

  const stopAllStreams = useCallback(() => {
    streamArray.current.forEach((stream) => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });
    dispatch({ type: CallActionType.DEL_ALL });
  }, [callInfo]);

  const stopPrevStreams = useCallback(() => {
    streamArray.current
      .filter((v, i) => i !== streamArray.current.length - 1)
      .forEach((stream) => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      });
  }, [callInfo]);

  const getUserMedia = useCallback(async () => {
    if (myInfo == null || socket === null) return;

    let newStream;
    try {
      newStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      console.log(newStream);
      dispatch({ type: CallActionType.SET_STREAM, payload: newStream });
      setIsDone(true);
      streamArray.current = [...streamArray.current, newStream];
    } catch (e) {
      // 크롬에서는 괜찮은데, 사파리에서는 granted라도 prompt 창이 떠야 연결이 됨
      // granted 가지고만 판단하면 안 됨
      // 설정을 변경한 후 꼭 새로고침을 해주세요
      // safari에서 계속해서 마이크가 켜지지 않는 경우에는 창을 껐다 켜주세요 => 사파리에서는 몇 번 하면 세션에 저장되어 프롬프트가 뜨지 않음
      dispatch({ type: CallActionType.SET_STREAM, payload: null });
      setIsDone(false);
    }
  }, [isDone, micStatus]);

  const goToMain = useCallback(() => {
    stopAllStreams();
    navigate("/main");
  }, []);

  const goToWaiting = useCallback(() => {
    stopPrevStreams();
    navigate("/waiting");
  }, []);

  return socket === null ? (
    <Loading />
  ) : (
    <div className="flex flex-col w-full h-full justify-center items-center">
      <div>
        {t(callInfo.roomType === SINGLE_CALL.TYPE ? "singleCall" : "groupCall")}
      </div>
      <div>음성 통화를 위해 마이크 권한을 허용으로 설정해 주세요!</div>
      <div className="h-[50%]">
        <MicrophoneSoundChecker isDone={isDone} />
      </div>
      <div className="h-[10%]">
        <BasicButton
          onClick={goToWaiting}
          text="매칭 시작하기"
          disabled={micStatus !== MIC_STATUS.GRANTED || !isDone}
        />
        <BasicButton onClick={goToMain} text="뒤로 가기" />
      </div>
    </div>
  );
};

export default Setting;
