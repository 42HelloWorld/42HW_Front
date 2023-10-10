import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SocketContext } from "@contexts/SocketProvider";
import { AuthContext } from "@contexts/AuthProvider";
import { CallContext, CallActionType } from "@contexts/CallProvider";
import { toast } from "react-toastify";
import BasicButton from "@utils/BasicButton";
import MicrophoneSoundChecker from "@utils/MicrophoneSoundChecker";
import { MIC_STATUS, PAGE, SINGLE_CALL, TRANSLATION } from "@utils/constant";
import Loading from "@utils/Loading";
import { useTranslation } from "react-i18next";

const Setting = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(TRANSLATION);
  const [isDone, setIsDone] = useState(false);
  const [micStatus, setMicStatus] = useState(MIC_STATUS.DENIED);
  const { myInfo } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { callInfo, dispatch } = useContext(CallContext);
  const streamArray = useRef<MediaStream[]>([]);

  useEffect(() => {
    // 잘못된 접근했을 때
    if (myInfo === null || socket === null) {
      stopAllStreams();
      navigate("/main");
    }
    getUserMedia();
  }, [micStatus, socket]);

  useEffect(() => {
    const id = setInterval(() => {
      pollMicAvailable();
    }, 300);

    return () => {
      clearInterval(id);
    };
  }, []);

  const pollMicAvailable = async () => {
    const permissionName = "microphone" as PermissionName;
    const result = await navigator.permissions.query({ name: permissionName });
    setMicStatus(result.state);
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
      toast.error("마이크 권한을 허용해 주세요!");
      dispatch({ type: CallActionType.DEL_ALL });
      setIsDone(false);
    }
  }, []);

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
        {t(
          `${PAGE.MAIN}.` +
            (callInfo.roomType === SINGLE_CALL.TYPE
              ? "singleCall"
              : "groupCall")
        )}
      </div>
      <div>{t(`${PAGE.SETTING}.info.permission`)}</div>
      <div className="h-[50%]">
        <MicrophoneSoundChecker isDone={isDone} />
      </div>
      <div className="h-[10%]">
        <BasicButton
          onClick={goToWaiting}
          text={t(`${PAGE.SETTING}.button.start`)}
          disabled={micStatus !== MIC_STATUS.GRANTED}
        />
        <BasicButton
          onClick={goToMain}
          text={t(`${PAGE.SETTING}.button.back`)}
        />
      </div>
    </div>
  );
};

export default Setting;
