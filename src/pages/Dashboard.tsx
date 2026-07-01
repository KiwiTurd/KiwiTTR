export default function Dashboard() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">
            Players
          </h2>

          <p className="text-5xl font-bold mt-4">
            0
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">
            Matches
          </h2>

          <p className="text-5xl font-bold mt-4">
            0
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">
            Average TTR
          </h2>

          <p className="text-5xl font-bold mt-4">
            —
          </p>
        </div>

      </div>
    </div>
  );
}