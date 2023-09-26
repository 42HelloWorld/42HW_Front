import React, { useLayoutEffect, useState } from "react";
import { Routes, Route } from "react-router";
import Main from "@pages/Main";
import Waiting from "@pages/Waiting";
import Call from "@pages/Call";
import Setting from "@pages/Setting";
import NotFound from "@pages/NotFound";
import { getCookie } from "@utils/getCookie";

const MainRouter = () => {
  const [isLoading, setIsLoading] = useState(true);
  useLayoutEffect(() => {
    const cookie = getCookie("login");
    const isLogin = localStorage.getItem("isLogin");
    if (!(isLogin === "true" && cookie)) {
      alert("로그인 정보가 유효하지 않습니다. 다시 로그인 해주세요.");
      localStorage.removeItem("isLogin");
      window.location.href = "/";
    } else setIsLoading(false);
  }, []);

  return (
    <Routes>
      <Route path="/main" Component={Main} />
      <Route path="/setting" Component={Setting} />
      <Route path="/waiting" Component={Waiting} />
      <Route path="/call" Component={Call} />
      <Route path="*" element={<NotFound isLoading={isLoading} />} />
    </Routes>
  );
};

export default MainRouter;
