import { FC } from "react";
import { PulseLoader } from "react-spinners";
interface Props {
  children?: React.ReactNode;
  text?: string;
}

const Loading: FC<Props> = ({ children, text }) => {
  const pulseLoaderCss = {
    paddingTop: "20px",
    width: "45px",
    margin: "0 auto",
  };

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="px-10 h-1/4 flex justify-center items-center">{text}</div>
      <div className="pt-8 h-1/3">
        <img className="mx-auto" src="login-image.svg" alt="loading" />
        <PulseLoader
          color={"#808080"}
          size={10}
          aria-label="Loading Spinner"
          data-testid="loader"
          cssOverride={pulseLoaderCss}
        />
      </div>
      <div className="flex justify-center h-1/6 flex-col items-center">
        {children}
      </div>
    </div>
  );
};

export default Loading;

Loading.defaultProps = {
  children: null,
  text: "",
};
