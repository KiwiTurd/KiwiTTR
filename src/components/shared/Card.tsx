import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`kiwittr-solid-card bg-white rounded-xl shadow ${className}`}
    >
      {children}
    </div>
  );
}
