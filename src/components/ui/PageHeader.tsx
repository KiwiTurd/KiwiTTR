import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
}: Props) {
  return (
    <div className="flex justify-between items-start mb-8">

      <div>

        <h1 className="text-5xl font-bold">
          {title}
        </h1>

        {subtitle && (

          <p className="text-slate-500 mt-2">
            {subtitle}
          </p>

        )}

      </div>

      {actions && (
        <div>
          {actions}
        </div>
      )}

    </div>
  );
}