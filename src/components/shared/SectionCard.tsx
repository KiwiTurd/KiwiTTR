import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  description,
  actions,
  children,
  className = "",
}: Props) {
  return (
    <section
      className={`
        rounded-2xl
        border
        border-slate-200
        bg-white

        shadow-sm

        ${className}
      `}
    >
      {(title || actions) && (
        <div
          className="
            flex
            flex-col
            gap-4

            border-b
            border-slate-200

            px-6
            py-5

            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div>

            {title && (
              <h2 className="text-xl font-bold text-slate-900">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            )}

          </div>

          {actions && (
            <div className="flex items-center gap-2">

              {actions}

            </div>
          )}

        </div>
      )}

      <div className="p-6">

        {children}

      </div>

    </section>
  );
}