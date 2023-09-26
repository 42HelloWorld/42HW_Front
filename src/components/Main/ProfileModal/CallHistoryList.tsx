import { useCallback, useEffect, useState } from "react";
import { ICallHistory } from "@typings/db";
import { useNavigate } from "react-router";
import { API_URL } from "@utils/constant";
import axios from "axios";
import CallHistory from "@components/Main/ProfileModal/CallHistory";

const CallHistoryList = () => {
  const [callHistory, setCallHistory] = useState<ICallHistory[]>([]);
  const navigate = useNavigate();

  const getCallHistory = useCallback(async () => {
    const response = await axios.get(`${API_URL}/call/callHistory`);
    setCallHistory(response.data);
  }, []);

  useEffect(() => {
    getCallHistory();
  }, []);

  return (
    <div className="flex flex-col h-[60%] justify-between">
      <div className="h-[8%] text-xl">대화 내역</div>
      <div className="h-[85%] overflow-auto bg-gray-200 rounded-md p-2 m-1 px-2">
        {callHistory.length === 0 ? (
          <div className="h-full flex justify-center items-center text-gray-500">
            대화 내역이 존재하지 않습니다!
          </div>
        ) : (
          callHistory.map((v) => (
            <CallHistory key={`${v.id}-${v.startTime}`} callData={v} />
          ))
        )}
      </div>
    </div>
  );
};

export default CallHistoryList;
