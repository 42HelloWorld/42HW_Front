import { useCallback, useEffect, useState } from "react";
import { ICallHistory } from "@typings/db";
import { API_URL } from "@utils/constant";
import axios from "axios";
import CallHistory from "@components/Profile/CallHistory";

const CallHistoryList = () => {
  const [callHistory, setCallHistory] = useState<ICallHistory[]>([]);

  const getCallHistory = useCallback(async () => {
    const response = await axios.get(`${API_URL}/call/callHistory`);
    setCallHistory(response.data);
  }, []);

  useEffect(() => {
    getCallHistory();
  }, []);

  return (
    <div className="flex flex-col h-[60%] justify-between">
      <div id="cont-profile">
        <div id="title">대화 내역</div>
        <div id="board">
          {callHistory.length === 0 ? (
            <div id="line-dashed">
              <p>
                대화 내역이 존재하지 않습니다!
              </p>
            </div>
          ) : (
            callHistory.map((v) => (
              <CallHistory key={`${v.id}-${v.startTime}`} callData={v} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CallHistoryList;
