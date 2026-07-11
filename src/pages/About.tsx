import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Meaningful NZ rankings",
    copy: "Every recorded result helps build a current picture of playing strength, from club competition through to events.",
  },
  {
    icon: Users,
    title: "Built around clubs",
    copy: "Players, clubs, matches and events live together, giving New Zealand table tennis communities one connected home.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent by design",
    copy: "Rating changes follow a consistent formula and can be explored before a result is entered.",
  },
];

export default function About() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-white shadow-sm md:px-12 md:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-slate-100">
            <MapPin className="h-4 w-4" />
            Made for table tennis in Aotearoa
          </div>
          <h1 className="mt-5 text-4xl font-normal tracking-tight md:text-6xl">
            A clearer picture of table tennis performance in New Zealand.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            KiwiTTR is an independent table tennis rating system that turns
            match results into useful, easy-to-follow NZ rankings for players,
            clubs and local competition.
          </p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map(({ icon: Icon, title, copy }) => (
          <article
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            key={title}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-2 leading-7 text-slate-600">{copy}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
            Our purpose
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Make every local match count.
          </h2>
        </div>
        <div className="space-y-4 leading-7 text-slate-600">
          <p>
            Table tennis is played in communities across New Zealand, but
            results can be scattered and player strength can be hard to compare.
            KiwiTTR brings those results together in a format that is useful to
            players, organisers and clubs.
          </p>
          <p>
            Players can follow progress over time, discover where they sit in
            the NZ table tennis rankings and understand what changed after each
            match. Organisers gain practical tools for events, team games and
            balanced competition.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-3xl bg-blue-700 p-7 text-white md:flex-row md:items-center md:justify-between md:p-9">
        <div>
          <h2 className="text-2xl font-bold">See where the competition stands.</h2>
          <p className="mt-1 text-blue-100">Explore the latest KiwiTTR player rankings.</p>
        </div>
        <Link
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
          to="/rankings"
        >
          View NZ rankings <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
