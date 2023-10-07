import React from "react";
import { Routes, Route } from "react-router";
// 동적 import 추가하기
import Login from "@pages/Login";
import MainRouter from "@utils/MainRouter";
import { ToastContainer } from "react-toastify";
import * as process from "process";
import { COUNT, MILLISECOND } from "@utils/constant";
import i18n from "./i18n";

console.log(i18n);

(window as any).global = window;
(window as any).process = process;
(window as any).Buffer = [];

function App() {
  return (
    <div className="h-full">
      <div className="h-full">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="*" element={<MainRouter />} />
        </Routes>
        <ToastContainer
          position="top-center"
          theme="colored"
          hideProgressBar={true}
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
