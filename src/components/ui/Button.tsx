type Props = {
  children: React.ReactNode;
  onClick?: () => void;
};

export default function Button({
  children,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-900 hover:bg-blue-800 text-white rounded-lg px-4 py-2 transition"
    >
      {children}
    </button>
  );
}