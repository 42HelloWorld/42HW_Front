import { useNavigate } from "react-router";
import { useCallback } from "react";
import ProfileCard from "@components/Profile/ProfileCard";
import LangSelect from "@components/Profile/LangSelect";
import CallHistoryList from "@components/Profile/CallHistoryList";
import BasicButton from "@utils/BasicButton";
import Header from "@utils/Header";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_URL } from "@utils/constant";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const logout = useCallback(async () => {
    await axios.get(`${API_URL}/auth/logout`);
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  }, []);

  const closeModal = useCallback(() => {
    navigate("/main");
  }, []);

  return (
    <>
      <Header onClick={closeModal} title={t("profile")} />
      <div className="h-[90%] w-full p-4">
        <div className="h-[100%] w-full flex flex-col justify-around">
          <ProfileCard />
          <div className="h-[70%] flex flex-col justify-evenly">
            <LangSelect />
            <CallHistoryList />
          </div>
          <div className="h-[10%] flex items-center justify-center">
            <BasicButton onClick={logout} text="로그아웃" />
          </div>
        </div>
      </div>
    </>
  );
};
export default Profile;
