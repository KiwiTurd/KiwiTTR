const items = [
  "Dashboard",
  "Rankings",
  "Players",
  "Matches",
  "Settings",
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200">
      <div className="p-6 text-xl font-bold">
        Navigation
      </div>

      <nav>
        {items.map((item) => (
          <button
            key={item}
            className="w-full text-left px-6 py-3 hover:bg-slate-100 transition"
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}