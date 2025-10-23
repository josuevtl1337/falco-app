import Banquets from "./banquets";

export default function TableWithChairs({
  seats = 4,
  label = "",
}: {
  seats?: number;
  label?: string;
}) {
  const positions =
    seats === 2
      ? ["top-24 left-2", "bottom-20 left-2"]
      : [
          "top-12 left-24",
          "bottom-8 left-24",
          "bottom-8 right-20",
          "top-12 right-20",
        ];
  return (
    <div className="relative w-20 h-20 cursor-pointer bg-red-500">
      {/* Sillas */}
      {Array.from({ length: seats }).map((_, i) => (
        <div key={i} className={`absolute ${positions[i % positions.length]}`}>
          <Banquets />
        </div>
      ))}
      {/* Mesa */}
      <div className="hover:scale-[1.03] transition-transform w-24 h-24 bg-gray-400 flex items-center justify-center mx-auto my-auto  border-gray-600 text-xs font-bold text-black">
        {label}
      </div>
    </div>
  );
}
