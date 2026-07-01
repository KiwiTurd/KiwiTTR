import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100 flex">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <Navbar />

        <main className="p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}