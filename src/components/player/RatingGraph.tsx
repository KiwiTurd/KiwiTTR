import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import type { RatingHistory } from "../../types/ratingHistory";

import {
  getPlayerRatingHistory,
} from "../../services/supabase/ratingHistoryService";

interface Props {
  playerId: string;
}

export default function RatingGraph({
  playerId,
}: Props) {
  const [history, setHistory] = useState<RatingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadHistory();
  }, [playerId]);

  async function loadHistory() {
    try {
      setLoading(true);

      const data = await getPlayerRatingHistory(playerId);

      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() -
          new Date(b.recordedAt).getTime()
      );

      setHistory(sorted);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const chartData = history.map((record, index) => ({
    date:
      index === 0
        ? "Start"
        : new Date(record.recordedAt).toLocaleDateString(),

    rating:
      index === 0
        ? record.ratingBefore
        : record.ratingAfter,

    change: record.ratingChange,
  }));

  if (
    history.length > 0 &&
    chartData.length > 0
  ) {
    chartData.push({
      date: new Date(
        history[history.length - 1].recordedAt
      ).toLocaleDateString(),

      rating:
        history[history.length - 1].ratingAfter,

      change:
        history[history.length - 1].ratingChange,
    });
  }

  return (
    <div className="bg-white rounded-xl shadow p-8">

      <h2 className="text-2xl font-bold mb-6">
        Rating History
      </h2>

      {loading ? (

        <p className="text-slate-500">
          Loading rating history...
        </p>

      ) : chartData.length === 0 ? (

        <p className="text-slate-500">
          No rating history available yet.
        </p>

      ) : (

        <ResponsiveContainer
          width="100%"
          height={320}
        >

          <LineChart data={chartData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="date" />

            <YAxis />

            <Tooltip
              formatter={(value) => [
                value,
                "Rating",
              ]}
            />

            <Line
              type="monotone"
              dataKey="rating"
              stroke="#1e3a8a"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 7 }}
            />

          </LineChart>

        </ResponsiveContainer>

      )}

    </div>
  );
}