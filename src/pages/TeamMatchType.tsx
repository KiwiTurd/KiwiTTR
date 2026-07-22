import {
  ArrowLeft,
  ArrowRight,
  GitBranch,
  Shuffle,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";
import SlateImagePageHeader from "../components/shared/SlateImagePageHeader";

const matchTypes = [
  {
    id: "classic-6",
    name: "Classic 6",
    description:
      "Six players per team, doubles first, then ordered singles. First to 9 or 8-8 draw.",
    href: "/team-games/new/classic-6",
    icon: UsersRound,
  },
  {
    id: "classic-3",
    name: "Classic 3",
    description:
      "Three players per team. Home 1/2/3 plays Away 2/1/3, then 1 v 1 and D1 v D1 if needed.",
    href: "/team-games/new/classic-3",
    icon: GitBranch,
  },
  {
    id: "abc-123",
    name: "ABC v 123",
    description:
      "Three players per team, fixed ABC v 123 play-through map with singles and doubles.",
    href: "/team-games/new/abc-123",
    icon: Shuffle,
  },
  {
    id: "custom",
    name: "Custom",
    description:
      "Choose player count, ordering, match style, games and doubles for a custom team event.",
    href: "/team-games/new/custom",
    icon: SlidersHorizontal,
  },
];

export default function TeamMatchType() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SlateImagePageHeader
        pageKey="team-game-type"
        title="Team Match Type"
        subtitle="Choose the structure for the team game before entering clubs, players and play order."
        actions={<Link to="/team-games" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"><ArrowLeft className="h-4 w-4" />Team Games</Link>}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {matchTypes.map((type) => {
          const Icon = type.icon;
          const isReady =
            Boolean(type.href);
          const content = (
            <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {isReady
                      ? "Available"
                      : "Template"}
                  </span>
                </div>
                <h2 className="text-2xl font-black">
                  {type.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {type.description}
                </p>
              </div>
              <div className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-700">
                {isReady
                  ? "Continue"
                  : "Coming Next"}
                {isReady && (
                  <ArrowRight className="h-4 w-4" />
                )}
              </div>
            </div>
          );

          if (!type.href) {
            return (
              <div key={type.id}>
                {content}
              </div>
            );
          }

          return (
            <Link
              key={type.id}
              to={type.href}
              className="h-full"
            >
              {content}
            </Link>
          );
        })}
      </section>

    </div>
  );
}
