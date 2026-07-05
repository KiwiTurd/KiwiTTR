import type { ReactNode } from "react";

interface Props {
  backLink: ReactNode;
  header: ReactNode;
  stats: ReactNode;
  children: ReactNode;
}

export default function ProfileLayout({
  backLink,
  header,
  stats,
  children,
}: Props) {
  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {backLink}

      {header}

      <div className="grid md:grid-cols-4 gap-4">

        {stats}

      </div>

      {children}

    </div>
  );
}