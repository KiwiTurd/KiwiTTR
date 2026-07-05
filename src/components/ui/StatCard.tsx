import Card from "../shared/Card";

interface Props {
  title: string;
  value: string | number;
}

export default function StatCard({
  title,
  value,
}: Props) {
  return (
    <Card className="p-6 text-center">

      <p className="text-slate-500">
        {title}
      </p>

      <p className="text-4xl font-bold mt-2">
        {value}
      </p>

    </Card>
  );
}