import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
};

export default function StatCard({
  label,
  value,
  icon,
  subtitle,
  trend,
  className = "",
}: Props) {
  return (

    <div
      className={`
        rounded-2xl
        border
        border-slate-200
        bg-white

        p-6

        shadow-sm

        transition-all
        duration-200

        hover:-translate-y-1
        hover:shadow-lg

        ${className}
      `}
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">

            {label}

          </p>

          <h3 className="mt-2 text-4xl font-black tracking-tight text-slate-900">

            {value}

          </h3>

          {subtitle && (

            <p className="mt-2 text-sm text-slate-500">

              {subtitle}

            </p>

          )}

        </div>

        {icon && (

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center

              rounded-xl

              bg-blue-50

              text-blue-900
            "
          >

            {icon}

          </div>

        )}

      </div>

      {trend && (

        <div className="mt-5">

          <span
            className={`
              inline-flex
              items-center

              rounded-full

              px-2.5
              py-1

              text-xs
              font-semibold

              ${
                trend.positive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            `}
          >

            {trend.positive ? "+" : ""}

            {trend.value}

          </span>

        </div>

      )}

    </div>

  );
}