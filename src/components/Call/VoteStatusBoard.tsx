import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useContext,
  FC,
} from "react";
import { VOTE_SELECT } from "@utils/constant";
import { SocketContext } from "@contexts/SocketProvider";

interface Props {
  totalNum: number | null;
}

const VoteStatusBoard: FC<Props> = ({ totalNum }) => {
  const { socket } = useContext(SocketContext);
  const [voteStatus, setVoteStatus] = useState<string[]>(
    [VOTE_SELECT.YES].concat(new Array(totalNum! - 1).fill(VOTE_SELECT.ONGOING))
  );
  const indexRef = useRef<number>(1);
  const totalNumRef = useRef<number>(totalNum);

  const onSomeoneAccept = useCallback(() => {
    setVoteStatus((prev) => {
      const copy = prev.map((v) => v);
      copy[indexRef.current++] = VOTE_SELECT.YES;
      return copy;
    });
  }, [voteStatus]);

  const onSomeoneReject = useCallback(() => {
    setVoteStatus((prev) => {
      const copy = prev.map((v) => v);
      copy[indexRef.current++] = VOTE_SELECT.NO;
      return copy;
    });
  }, [voteStatus]);

  useEffect(() => {
    socket?.on("someoneAccept", onSomeoneAccept);
    socket?.on("someoneReject", onSomeoneReject);
    return () => {
      socket?.off("someoneAccept", onSomeoneAccept);
      socket?.off("someoneReject", onSomeoneReject);
    };
  }, []);

  return (
    <div
      className={`grid grid-cols-${totalNumRef.current} w-full my-1 mx-auto`}
    >
      {voteStatus.map((v, i) => (
        <div key={`voteBlock-${v}-${i}`} className="p-[2px]">
          <div
            className={`h-[20px] bg-${
              v === VOTE_SELECT.ONGOING
                ? "gray"
                : v === VOTE_SELECT.YES
                ? "green"
                : "red"
            }-500`}
            key={`voteToast + ${v} + ${i}`}
          />
        </div>
      ))}
    </div>
  );
};

export default VoteStatusBoard;
