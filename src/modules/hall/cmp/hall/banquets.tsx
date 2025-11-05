import { FC } from "react";

// export default function Banquets({ label = "" }: { label?: string }, onChangeSeat?: (id: string) => void, isClickable = false) {
interface IBanquetsProps {
  label?: string;
  onClick?: (id: string) => void;
  isClickable?: boolean;
  hasOrder?: boolean;
}

const Banquets: FC<IBanquetsProps> = (props) => {
  const { label = "", onClick, isClickable = false } = props;
  return (
    <div className="flex flex-col m-1">
      <div
        onClick={() => {
          isClickable && onClick ? onClick(label) : undefined;
        }}
        className={`hover:scale-[1.02] cursor-pointer w-12 h-12 self-start bg-[var(--banquets-background)] 
        rounded-full  flex items-center justify-center ${
          isClickable ? "hover:brightness-125 shadow-md" : ""
        }`}
      >
        <p className={"text-md"}>{label}</p>
      </div>
    </div>
  );
};

export default Banquets;
