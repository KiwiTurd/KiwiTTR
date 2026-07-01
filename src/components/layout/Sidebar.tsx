import { NavLink } from "react-router-dom";

const items = [
  { name: "🏠 Dashboard", path: "/" },
  { name: "👥 Players", path: "/players" },
  { name: "🏆 Rankings", path: "/rankings" },
  { name: "🎯 Matches", path: "/matches" },
  { name: "🧮 Simulator", path: "/simulator" },
  { name: "⚙️ Settings", path: "/settings" },
  { name: "🏓 Clubs", path: "/clubs" },
  { name: "🏟 Events", path: "/events" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200">

      <div className="p-6 text-xl font-bold border-b">
        🏓 KiwiTTR
      </div>

      <nav className="p-3 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 transition ${
                isActive
                  ? "bg-blue-900 text-white"
                  : "hover:bg-slate-100"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}