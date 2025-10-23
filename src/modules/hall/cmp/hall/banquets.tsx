export default function Banquets({ label = "" }: { label?: string }) {
  return (
    <div className="flex flex-col m-2">
      <div
        className="hover:scale-[1.02] cursor-pointer w-16 h-16 self-start bg-[var(--banquets-background)] 
        rounded-full  flex items-center justify-center hover:border-2"
      >
        <p className={"text-md"}>{label}</p>
      </div>
    </div>
  );
}
