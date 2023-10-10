import { CallType } from "@typings/front";

export const API_URL = process.env.REACT_APP_API_URL;
export const FRONT_URL = process.env.REACT_APP_FRONT_URL;

export const COUNT = {
  DEFAULT: 1.5,
  DIFF: 1.5,
  MATCH: 3,
  VOTE: 10,
  HANG_UP: 3,
};
export const MILLISECOND = 1000;

export const SCREEN = {
  INIT: "INIT",
  TOPIC_SELECT: "TOPIC_SELECT",
  TOPIC_MODAL: "TOPIC_MODAL",
};

export const MIC_STATUS = {
  GRANTED: "granted",
  PROMPT: "prompt",
  DENIED: "denied",
};

export const LANG = {
  EN: "en",
  KR: "kr",
};

export const LANGLIST = {
  EN: ["English", "Korean"],
  KR: ["영어", "한국어"],
};

export const VOTE_SELECT = {
  YES: "yes",
  NO: "no",
  ONGOING: "ongoing",
};

export const SINGLE_CALL: CallType = {
  TYPE: "single",
  TOTAL_NUM: 2,
};

export const GROUP_CALL: CallType = {
  TYPE: "group",
  TOTAL_NUM: 4,
};

export const TOPIC_LIST = [
  "Shopping",
  "Travel",
  "Sports",
  "Music",
  "Food",
  "Hobbies",
  "Random",
  "",
  "",
  // "Business",
  // "Home",
  // "42",
];

// google URL도 ENV화
export const ICE_SERVER = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun3.l.google.com:19302",
      "stun:stun4.l.google.com:19302",
    ],
  },
  {
    urls: `turn:${process.env.REACT_APP_TURN_URL}`,
    username: process.env.REACT_APP_TURN_USERNAME,
    credential: process.env.REACT_APP_TURN_PASSWORD,
  },
];

export const OPPONENT_LIST = {
  BOX_WIDTH: 280,
  PADDING: 20,
};
