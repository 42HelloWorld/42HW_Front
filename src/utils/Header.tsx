import { FC } from "react";

interface Props {
  onClick: () => void;
  title: string;
}

const Header: FC<Props> = ({ onClick, title }) => {
  return (
    <div
      className={`h-[10%] flex items-center justify-between bg-orange-100 w-full`}
    >
      <button
        className="w-[10%] h-full m-2 flex items-center justify-center"
        onClick={onClick}
      >
        <img width="25" height="25" src="arrow.png" alt="profile_back" />
      </button>
      <b className="text-lg">{title}</b>
      <div className="w-[10%] h-full m-2 flex items-center justify-center" />
    </div>
  );
};

export default Header;
