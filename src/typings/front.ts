export interface CallType {
  TYPE: string;
  TOTAL_NUM: number;
}

export interface OpponentInfo {
  initiator: boolean;
  opponentNickname: string;
  peerIndex: number;
}

export interface CallInfo {
  stream: MediaStream | null;
  roomName: string | null;
  roomType: string | null;
  opponent: OpponentInfo[] | null;
  currNum: number | null;
}
