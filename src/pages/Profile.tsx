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


import "@styles/Profile.css"

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
        <div >
          <ProfileCard />
          <div id="profile-view">
            <div id="view-child">
              <LangSelect />
            </div>
            <div id="view-child">
              <CallHistoryList />
            </div>
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
