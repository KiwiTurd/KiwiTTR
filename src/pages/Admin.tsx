import SlateImagePageHeader from "../components/shared/SlateImagePageHeader";

export default function Admin() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <SlateImagePageHeader pageKey="admin" title="Admin Console" subtitle="Manage KiwiTTR." />

      <div className="grid md:grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="font-bold text-lg">
            Users
          </h2>

          <p className="text-slate-500 mt-2">
            Manage accounts and roles.
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="font-bold text-lg">
            Clubs
          </h2>

          <p className="text-slate-500 mt-2">
            Manage clubs.
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="font-bold text-lg">
            Players
          </h2>

          <p className="text-slate-500 mt-2">
            Manage player records.
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="font-bold text-lg">
            Events
          </h2>

          <p className="text-slate-500 mt-2">
            Manage tournaments and events.
          </p>

        </div>

      </div>

    </div>
  );
}
