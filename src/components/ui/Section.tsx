import type { ReactNode } from "react";

import Card from "../shared/Card";

interface Props {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function Section({
  title,
  children,
  actions,
}: Props) {
  return (
    <Card className="p-8">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold">
          {title}
        </h2>

        {actions}

      </div>

      {children}

    </Card>
  );
}