interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6">

      <p className="text-slate-500 text-sm">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>

      {subtitle && (
        <p className="text-slate-500 mt-2">
          {subtitle}
        </p>
      )}

    </div>
  );
}