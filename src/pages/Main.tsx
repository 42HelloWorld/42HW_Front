import { useEffect, useContext, useCallback, useState } from "react";
import { AuthContext } from "@contexts/AuthProvider";
import { API_URL } from "@utils/constant";
import { useNavigate } from "react-router";
import axios from "axios";
import Loading from "@utils/Loading";
import ChatButton from "@components/Main/ChatButton";
import ProfileModal from "@components/Main/ProfileModal/ProfileModal";
import "@styles/Main.css";
import { SocketContext } from "@contexts/SocketProvider";
import { io } from "socket.io-client";

const Main = () => {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { myInfo, setMyInfo, isLoading, setIsLoading } =
    useContext(AuthContext);
  const { socket, setSocket } = useContext(SocketContext);

  const connectSocket = useCallback(() => {
    if (socket === null) {
      // TODO : useSocket 만들기
      const socket = io(`${API_URL}`, {
        query: { nickname: myInfo?.nickname },
      });
      console.log(socket);
      setSocket(socket);
    }
  }, [myInfo]);

  const getMyInfo = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      setMyInfo(response.data);
      setIsLoading(false);
      connectSocket();
    } catch (e) {
      alert("로그인 정보가 유효하지 않습니다. 다시 로그인 해주세요.");
      navigate("/login");
    }
  }, []);

  const joinSingleChat = useCallback(() => {
    console.log("1:1 chat");
    navigate("/setting");
  }, []);

  const joinGroupChat = useCallback(() => {
    console.log("group chat");
    navigate("/setting");
  }, []);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    getMyInfo();
  }, []);

  return isLoading ? (
    <Loading />
  ) : (
    <div className="flex flex-col h-full justify-center items-center relative overflow-hidden">
      <ChatButton
        value="1:1 chat"
        css="hover:bg-gray-100"
        onClick={joinSingleChat}
      />
      <button className="absolute" onClick={openModal}>
        <img
          draggable="false"
          className="mx-auto w-[150px] h-[150px] rounded-[100%] bg-[#ffffff]"
          src={myInfo && myInfo.avatar ? myInfo.avatar : "default-avatar.jpeg"}
          alt="main-avatar"
        />
      </button>
      <ChatButton
        value="Group chat"
        css="rounded-t-3xl bg-orange-100 shadow-[inset_0_0.2em_rgba(221,221,221,1)] hover:bg-orange-200"
        onClick={joinGroupChat}
      />
      <ProfileModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
};

export default Main;
