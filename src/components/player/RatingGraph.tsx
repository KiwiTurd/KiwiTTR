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
import { getNewZealandDate } from "../../utils/newZealandDate";

interface Props {
  playerId: string;
  currentRating: number;
  initialRating: number;
  initialRatingAt: string;
}

type Filter =
  | "all"
  | "year"
  | "12m"
  | "6m"
  | "3m";

export default function RatingGraph({
  playerId,
  currentRating,
  initialRating,
  initialRatingAt,
}: Props) {
  const [history, setHistory] = useState<
    RatingHistory[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState<Filter>("all");

  const consistentHistory = useMemo(() => {
    const uniqueByMatch = new Map<string, RatingHistory>();

    history
      .filter(
        record =>
          record.ratingAfter ===
          record.ratingBefore + record.ratingChange
      )
      .forEach(record => {
        uniqueByMatch.set(record.matchId, record);
      });

    const valid = [...uniqueByMatch.values()].sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() -
        new Date(b.recordedAt).getTime()
    );

    const currentRatingIndex = valid.findLastIndex(
      record => record.ratingAfter === currentRating
    );

    // If replayed/deleted matches left stale entries after the player's
    // current rating, trim only that trailing portion. Older valid history
    // remains visible even if a legacy gap prevents a perfect chain.
    return currentRatingIndex >= 0
      ? valid.slice(0, currentRatingIndex + 1)
      : valid;
  }, [currentRating, history]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);

        const data = await getPlayerRatingHistory(playerId);
        const sorted = [...data].sort(
          (a, b) =>
            new Date(a.recordedAt).getTime() -
            new Date(b.recordedAt).getTime()
        );

        if (!cancelled) {
          setHistory(sorted);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [playerId]);

  const chartData = useMemo(() => {

    const now = new Date();

    const isIncludedByFilter = (date: Date) => {
      if (filter === "all") {
        return true;
      }

      switch (filter) {
        case "year":
          return date.getFullYear() === now.getFullYear();

        case "12m": {
          const cutoff = new Date();
          cutoff.setMonth(cutoff.getMonth() - 12);
          return date >= cutoff;
        }

        case "6m": {
          const cutoff = new Date();
          cutoff.setMonth(cutoff.getMonth() - 6);
          return date >= cutoff;
        }

        case "3m": {
          const cutoff = new Date();
          cutoff.setMonth(cutoff.getMonth() - 3);
          return date >= cutoff;
        }

        default:
          return true;
      }
    };

    const filtered = consistentHistory.filter(
      record => isIncludedByFilter(new Date(record.recordedAt))
    );

    const today = getNewZealandDate();
    const grouped = new Map<string, RatingHistory[]>();

    filtered.forEach(record => {
      const day = getNewZealandDate(
        new Date(record.recordedAt)
      );
      grouped.set(day, [
        ...(grouped.get(day) ?? []),
        record,
      ]);
    });

    const collapsedRecords = [...grouped.entries()]
      .sort(([dayA], [dayB]) => dayA.localeCompare(dayB))
      .flatMap(([day, records]) => {
        const ordered = [...records].sort(
          (a, b) =>
            new Date(a.recordedAt).getTime() -
            new Date(b.recordedAt).getTime()
        );

        return day === today
          ? ordered
          : [ordered[ordered.length - 1]];
      });
    const displayedRecords = collapsedRecords.filter(
      (record, index) =>
        index === 0 ||
        record.ratingAfter !== collapsedRecords[index - 1].ratingAfter
    );

    const ratingPoints = displayedRecords.map((record, index) => {
      const recordedAt = new Date(record.recordedAt);
      const isToday = getNewZealandDate(recordedAt) === today;

      return {
        x: `${record.recordedAt}-${record.matchId}-${index}`,
        label: recordedAt.toLocaleString("en-NZ", {
          timeZone: "Pacific/Auckland",
          day: "numeric",
          month: "short",
          ...(isToday
            ? {
                hour: "numeric",
                minute: "2-digit",
              }
            : {}),
        }),
        rating: record.ratingAfter,
      };
    });

    const storedInitialDate = new Date(initialRatingAt);
    const firstRecordedDate = consistentHistory[0]
      ? new Date(consistentHistory[0].recordedAt)
      : null;
    const initialDate = Number.isNaN(storedInitialDate.getTime())
      ? firstRecordedDate
      : storedInitialDate;

    if (!initialDate || !isIncludedByFilter(initialDate)) {
      return ratingPoints;
    }

    return [
      {
        x: `initial-${initialRatingAt}`,
        label: initialDate.toLocaleString("en-NZ", {
          timeZone: "Pacific/Auckland",
          day: "numeric",
          month: "short",
        }),
        rating: initialRating,
      },
      ...ratingPoints,
    ];

  }, [consistentHistory, filter, initialRating, initialRatingAt]);

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
    <div>

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
