import Banquets from "./banquets";

export default function TableWithChairs({
  hasOrder = false,
  seats = 4,
  label = "",
  id = "",
  onClick,
}: {
  seats?: number;
  label?: string;
  onClick?: (id: string) => void;
  hasOrder?: boolean;
  id?: string;
}) {
  const positions =
    seats === 2
      ? ["top-12 left-2", "bottom-12 left-2"]
      : [
          "top-10 left-18",
          "bottom-8 left-18",
          "bottom-8 right-18",
          "top-10 right-18",
        ];
  return (
    <div className="relative w-18 h-18 cursor-pointer">
      {/* Mesa */}
      <div
        onClick={() => onClick && onClick(id)}
        className={`z-10 hover:scale-[1.03] transition-transform w-18 h-18 ${
          hasOrder ? "bg-green-400" : "bg-gray-400"
        } flex items-center justify-center mx-auto my-auto border-gray-600 text-xs font-bold text-black hover:brightness-150 rounded-lg shadow-lg`}
      >
        {label}
      </div>

      {/* Sillas */}
      {Array.from({ length: seats }).map((_, i) => (
        <div key={i} className={`absolute ${positions[i % positions.length]}`}>
          <Banquets isClickable={false} />
        </div>
      ))}
    </div>
  );
}
