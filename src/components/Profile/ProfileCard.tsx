import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@utils/constant";
import axios from "axios";
import { IUser } from "@typings/db";
import { BarLoader } from "react-spinners";

const ProfileCard = () => {
  const [myInfo, setMyInfo] = useState<IUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const getMyInfo = useCallback(async () => {
    const response = await axios.get(`${API_URL}/users`);
    setMyInfo(response.data);
  }, []);

  useEffect(() => {
    getMyInfo();

    setTimeout(() => {
      setIsOpen(true);
    }, 100);
  }, []);

  return (
    <div className="flex justify-center h-[20%] w-full">
      <div className="w-[80%] flex flex-col justify-around items-center">
        {myInfo ? (
          <div>
            <div id="board-profile-info">
              <div id="img-profile">
                <img draggable="false"
                  src={myInfo && myInfo.avatar ? myInfo.avatar : "default-avatar.jpeg"}
                  alt="profile-avatar"
                />
              </div>
              <div id="info">
                <div id="profile-name" className="text-center text-[20px]">{myInfo.nickname}</div>
                <div id="profile-campus"className="text-center">🇰🇷 42 {myInfo.campus}</div>
              </div>
            </div>
            <div id="board-profile-level">
              <div id="level-text"className="text-center mx-3">
                Lv {Math.floor(myInfo.level)}
              </div>
              <div id="level-bar">
                <div
                  style={{
                    width: isOpen ? `${(myInfo.level % 1) * 100}%` : "0%",
                    height: "15px",
                    borderRadius: "5px",
                    backgroundColor: "#4caf50",
                    transition: "width 1s ease",
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <BarLoader
            color={"#808080"}
            aria-label="Clip Spinner"
            data-testid="loader"
          />
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
