import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const styles = {
    primary:
      "bg-blue-900 hover:bg-blue-800 text-white",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-900",
    danger:
      "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 font-medium transition ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}