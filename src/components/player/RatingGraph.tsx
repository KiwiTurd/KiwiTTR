import { useEffect, useMemo, useState } from "react";

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

type Filter =
  | "all"
  | "year"
  | "12m"
  | "6m"
  | "3m";

export default function RatingGraph({
  playerId,
}: Props) {
  const [history, setHistory] = useState<
    RatingHistory[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState<Filter>("all");

  useEffect(() => {
    void loadHistory();
  }, [playerId]);

  async function loadHistory() {
    try {
      setLoading(true);

      const data =
        await getPlayerRatingHistory(
          playerId
        );

      const sorted = [...data].sort(
        (a, b) =>
          new Date(
            a.recordedAt
          ).getTime() -
          new Date(
            b.recordedAt
          ).getTime()
      );

      setHistory(sorted);

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  }

  const chartData = useMemo(() => {

    const now = new Date();

    const filtered = history.filter(
      (record) => {

        if (filter === "all") {
          return true;
        }

        const date = new Date(
          record.recordedAt
        );

        switch (filter) {

          case "year":

            return (
              date.getFullYear() ===
              now.getFullYear()
            );

          case "12m": {

            const cutoff =
              new Date();

            cutoff.setMonth(
              cutoff.getMonth() - 12
            );

            return date >= cutoff;

          }

          case "6m": {

            const cutoff =
              new Date();

            cutoff.setMonth(
              cutoff.getMonth() - 6
            );

            return date >= cutoff;

          }

          case "3m": {

            const cutoff =
              new Date();

            cutoff.setMonth(
              cutoff.getMonth() - 3
            );

            return date >= cutoff;

          }

          default:
            return true;

        }

      }
    );

    // Keep the LAST rating recorded each day

    // Keep every match played TODAY,
// but only the final rating for previous days.

const grouped = new Map<string, RatingHistory[]>();

filtered.forEach((record) => {
  const day = new Date(record.recordedAt)
    .toISOString()
    .split("T")[0];

  if (!grouped.has(day)) {
    grouped.set(day, []);
  }

  grouped.get(day)!.push(record);
});

// Find the latest day that has rating history
const latestDay = [...grouped.keys()]
  .sort()
  .at(-1);

const daily: RatingHistory[] = [];

[...grouped.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([day, records]) => {

    records.sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() -
        new Date(b.recordedAt).getTime()
    );

    if (day === latestDay) {

      // Show every rating change on the most recent day
      daily.push(...records);

    } else {

      // Older days collapse to the day's final rating
      daily.push(records[records.length - 1]);

    }

  });

    if (daily.length === 0) {
      return [];
    }

    const points = [];

for (let i = 0; i < daily.length; i++) {
  const record = daily[i];

  // First point = player's rating before their first recorded match
  if (i === 0) {
    points.push({
      x: record.recordedAt,
      label: new Date(record.recordedAt).toLocaleDateString(
        "en-NZ",
        {
          day: "numeric",
          month: "short",
        }
      ),
      rating: record.ratingBefore,
    });
  }

  // Every match contributes its ending rating
  points.push({
    x: `${record.recordedAt}-${i}`,
    label: new Date(record.recordedAt).toLocaleDateString(
      "en-NZ",
      {
        day: "numeric",
        month: "short",
      }
    ),
    rating: record.ratingAfter,
  });
}

return points;

  }, [history, filter]);

  const yMin = useMemo(() => {

    if (chartData.length === 0) {
      return 0;
    }

    return (
      Math.floor(
        Math.min(
          ...chartData.map(
            (d) => d.rating
          )
        ) / 100
      ) * 100
    );

  }, [chartData]);

  const yMax = useMemo(() => {

    if (chartData.length === 0) {
      return 100;
    }

    return (
      Math.ceil(
        Math.max(
          ...chartData.map(
            (d) => d.rating
          )
        ) / 100
      ) * 100
    );

  }, [chartData]);

  return (
    <div className="bg-white rounded-xl shadow p-8">

      <h2 className="text-2xl font-bold mb-6">
        Rating History
      </h2>

      <div className="flex flex-wrap gap-2 mb-6">

        {[
          ["all", "All"],
          ["year", "This Year"],
          ["12m", "12 Months"],
          ["6m", "6 Months"],
          ["3m", "3 Months"],
        ].map(([value, label]) => (

          <button
            key={value}
            onClick={() =>
              setFilter(
                value as Filter
              )
            }
            className={`px-4 py-2 rounded-lg transition ${
              filter === value
                ? "bg-blue-900 text-white"
                : "bg-slate-100 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>

        ))}

      </div>

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
          height={340}
        >

          <LineChart
            data={chartData}
          >

            <CartesianGrid strokeDasharray="3 3" />

           <XAxis
  dataKey="x"
  tickFormatter={(_, index) => chartData[index]?.label ?? ""}
/>

            <YAxis
              domain={[
                yMin,
                yMax,
              ]}
              allowDecimals={
                false
              }
            />

            <Tooltip
  labelFormatter={(_, payload) => {
    if (!payload?.length) return "";

    return payload[0].payload.label;
  }}
  formatter={(value) => [`${value}`, "Rating"]}
/>

            <Line
              type="monotone"
              dataKey="rating"
              stroke="#1e3a8a"
              strokeWidth={3}
              dot={{
                r: 4,
              }}
              activeDot={{
                r: 7,
              }}
              isAnimationActive
            />

          </LineChart>

        </ResponsiveContainer>

      )}

    </div>
  );
}