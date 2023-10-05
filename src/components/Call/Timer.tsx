import { useContext, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { timeConverter } from "@utils/timeConverter";
import { CallContext } from "@contexts/CallProvider";

const Timer = () => {
  const { callInfo } = useContext(CallContext);
  const [startTime] = useState<Date>(new Date());
  const [diff, setDiff] = useState<string>("00:00");
  const intervalId = useRef<any>(0);

  useEffect(() => {
    const id = setInterval(() => {
      const start = dayjs(startTime, "YYYY-MM-DD HH:mm:ss");
      const now = dayjs(new Date(), "YYYY-MM-DD HH:mm:ss");
      const diffSeconds = now.diff(start, "second");
      setDiff(timeConverter(diffSeconds, "colon"));
    }, 500);
    intervalId.current = id;

    return () => {
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (callInfo.currNum === 1) clearInterval(intervalId.current);
  }, [callInfo]);

  return <div className="text-gray-400 text-xl text-center">{diff}</div>;
};

export default Timer;
