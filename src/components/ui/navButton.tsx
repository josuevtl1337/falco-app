import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Cambiá esto si no usás Shadcn
import { ReactNode } from "react";

interface NavButtonProps {
  to: string;
  label?: string;
  icon?: ReactNode;
  className?: string;
}

export default function NavButton({
  to,
  label,
  icon,
  className = "",
}: NavButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate(to)}
      className={`w-full flex items-center justify-center space-x-2 text-lg p-6 ${className}`}
    >
      {icon && <span>{icon}</span>}
      {label && <span>{label}</span>}
    </Button>
  );
}
