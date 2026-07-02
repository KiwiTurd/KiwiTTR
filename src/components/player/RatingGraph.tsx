import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getPlayerRatingHistory } from "../../services/ratingHistoryService";

interface Props {
  playerId: string;
}

export default function RatingGraph({ playerId }: Props) {
  const history = getPlayerRatingHistory(playerId)
    .slice()
    .reverse()
    .map((record) => ({
      date: new Date(record.recordedAt).toLocaleDateString(),
      rating: record.ratingAfter,
      change: record.ratingChange,
    }));

  return (
    <div className="bg-white rounded-xl shadow p-8">
      <h2 className="text-2xl font-bold mb-6">
        Rating History
      </h2>

      {history.length === 0 ? (
        <p className="text-slate-500">
          No rating history available yet.
        </p>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="date" />

            <YAxis />

            <Tooltip
              formatter={(value, name) => [
                Number(value),
                name === "rating"
                  ? "Rating"
                  : String(name),
              ]}
            />

            <Line
              type="monotone"
              dataKey="rating"
              stroke="#1e3a8a"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}