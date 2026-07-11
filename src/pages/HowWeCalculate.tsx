import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calculator,
  Gauge,
  Scale,
  Sparkles,
} from "lucide-react";

export default function HowWeCalculate() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          <Calculator className="h-4 w-4" />
          Rating methodology
        </div>
        <h1 className="mt-4 text-4xl font-normal tracking-tight text-slate-900 md:text-6xl">
          How we calculate KiwiTTR ratings
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          KiwiTTR rewards results while accounting for the strength of both
          players. Expected wins move ratings a little; upsets move them more.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
          The core calculation
        </p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900">Expectation meets outcome</h2>
        <div className="mt-6 rounded-2xl bg-slate-900 p-5 font-mono text-sm text-slate-100 md:text-base">
          <p>Expected score = 1 / (1 + 10<sup>((opponent rating − player rating) / 400)</sup>)</p>
          <p className="mt-3">Rating change = 32 × (actual result − expected score) × provisional multiplier</p>
        </div>
        <div className="mt-7 grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-3xl font-black text-blue-700">1</p>
            <h3 className="mt-2 font-bold">Estimate the result</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">The rating gap produces each player&apos;s expected chance of winning.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-blue-700">2</p>
            <h3 className="mt-2 font-bold">Compare with reality</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">A win scores 1. The further that is from the expectation, the larger the change.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-blue-700">3</p>
            <h3 className="mt-2 font-bold">Update both players</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">The winner gains points and the loser loses points, rounded to a whole number.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200 text-amber-800">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">Provisional ratings</h2>
          <p className="mt-3 leading-7 text-slate-700">
            New players need room to reach their true playing level quickly.
            While provisional matches remain, KiwiTTR increases that player&apos;s
            rating movement using <strong>1 + remaining matches ÷ 10</strong>.
            The multiplier reduces after every match until it reaches the normal
            rate of 1.0.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Because each player has their own multiplier, a provisional match
            may not transfer an identical number of points between players.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Gauge className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">Why the opponent matters</h2>
          <p className="mt-3 leading-7 text-slate-600">
            A flat points table treats every win alike. KiwiTTR does not. Beating
            a much stronger player is new evidence about playing strength, so it
            earns more than beating someone the system already expected you to
            beat. The same logic limits the penalty for an expected loss.
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="flex items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 sm:flex">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">What makes it useful</h2>
            <ul className="mt-4 grid gap-4 text-slate-600 md:grid-cols-2">
              <li className="rounded-2xl bg-slate-50 p-4"><strong className="block text-slate-900">Responsive</strong>Upsets create meaningful movement instead of being lost in a simple win tally.</li>
              <li className="rounded-2xl bg-slate-50 p-4"><strong className="block text-slate-900">Quick to settle</strong>Provisional players can find an appropriate level without distorting ratings forever.</li>
              <li className="rounded-2xl bg-slate-50 p-4"><strong className="block text-slate-900">Consistent</strong>The same published calculation applies to every eligible singles result.</li>
              <li className="rounded-2xl bg-slate-50 p-4"><strong className="block text-slate-900">Easy to inspect</strong>Players can see before-and-after ratings and model a result with the calculator.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="flex justify-center">
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
          to="/simulator"
        >
          Try the TTR calculator <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
