import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { timeConverter } from "@utils/timeConverter";

const Timer = () => {
  const [startTime] = useState<Date>(new Date());
  const [diff, setDiff] = useState<string>("00:00");

  useEffect(() => {
    const id = setInterval(() => {
      const start = dayjs(startTime, "YYYY-MM-DD HH:mm:ss");
      const now = dayjs(new Date(), "YYYY-MM-DD HH:mm:ss");
      const diffSeconds = now.diff(start, "second");
      setDiff(timeConverter(diffSeconds, "colon"));
    }, 500);

    return () => {
      clearInterval(id);
    };
  }, []);

  return <div className="text-gray-400 text-xl text-center">{diff}</div>;
};

export default Timer;
