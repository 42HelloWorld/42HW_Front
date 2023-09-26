import React from "react";
import { Routes, Route } from "react-router";
// 동적 import 추가하기
import Login from "@pages/Login";

import MainRouter from "@utils/MainRouter";
import { ToastContainer } from "react-toastify";
import * as process from "process";
import { COUNT, MILLISECOND } from "@utils/constant";
import Redirect from "@pages/Redirect";

(window as any).global = window;
(window as any).process = process;
(window as any).Buffer = [];

function App() {
  return (
    <div className="container h-full">
      <div className="h-[100%]">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/redirect" element={<Redirect />} />
          <Route path="*" element={<MainRouter />} />
        </Routes>
        <ToastContainer
          position="top-center"
          theme="colored"
          closeOnClick={false}
          pauseOnHover={false}
          pauseOnFocusLoss={false}
          autoClose={COUNT.DEFAULT * MILLISECOND}
          style={{ maxWidth: "500px", width: "100vw" }}
        />
      </div>
    </div>
  );
}

export default App;
