import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  LineChart,
  Trophy,
  Users,
} from "lucide-react";
import KiwiTtrIcon from "../assets/KIWITTR - Logo.svg?react";
import LoadingScreen from "../components/shared/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import { getHomepageSettings } from "../services/supabase/homepageSettingsService";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  type HomepageSettings,
} from "../types/homepageSettings";

const benefits = [
  {
    icon: LineChart,
    title: "Track real progress",
    description: "Follow every rated result, see your rating move and understand how your performance develops over time.",
  },
  {
    icon: Trophy,
    title: "Make competition meaningful",
    description: "Compare players using current match evidence, not just a static grade or a once-a-year result.",
  },
  {
    icon: Building2,
    title: "Connect your club",
    description: "Keep players, events, team fixtures and results together in one clear home for your table tennis community.",
  },
  {
    icon: Users,
    title: "Run better events",
    description: "Give organisers useful ratings for seeding, balanced matchups and a more complete view of local competition.",
  },
];

export default function Home() {
  const { session, loading: authLoading } = useAuth();
  const [hero, setHero] = useState<HomepageSettings | null>(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  useEffect(() => {
    void getHomepageSettings()
      .then(setHero)
      .catch((error) => {
        console.warn("Homepage is using its default hero content.", error);
        setHero(DEFAULT_HOMEPAGE_SETTINGS);
      });
  }, []);

  const heroSlideCount = hero?.heroSlides.length ?? 0;
  const currentHeroIndex = Math.min(
    activeHeroIndex,
    Math.max(0, heroSlideCount - 1)
  );

  useEffect(() => {
    if (heroSlideCount < 2) return;

    const timer = window.setInterval(() => {
      setActiveHeroIndex((current) =>
        (current + 1) % heroSlideCount
      );
    }, 7000);

    return () => window.clearInterval(timer);
  }, [heroSlideCount]);

  if (isMobile && authLoading) {
    return <LoadingScreen label="Loading dashboard..." />;
  }

  if (isMobile && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="-mx-4 -mt-4 space-y-16 pb-8 md:-mx-8 md:-mt-8 md:space-y-24">
      <section className="relative min-h-[620px] overflow-hidden bg-slate-900 text-white md:min-h-[680px]">
        {hero ? (
          hero.heroSlides.map((slide, index) => {
            const active = index === currentHeroIndex;
            const Heading = index === 0 ? "h1" : "h2";

            return (
              <div
                key={slide.id}
                aria-hidden={!active}
                inert={!active}
                className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
                  active
                    ? "z-10 opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                <picture className="absolute inset-0">
                  {slide.mobileHeroImageUrl && (
                    <source
                      media="(max-width: 767px)"
                      srcSet={slide.mobileHeroImageUrl}
                    />
                  )}
                  <img
                    alt=""
                    className="h-full w-full object-cover object-center"
                    src={
                      slide.heroImageUrl ||
                      "/kiwittr-home-hero.jpg"
                    }
                  />
                </picture>

                {slide.slateFade && (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/15" />
                )}

                {slide.showKoru && (
                  <KiwiTtrIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-[34%] top-1/2 z-[1] w-[clamp(54rem,80vw,84rem)] max-w-none -translate-y-1/2 fill-slate-500 opacity-40 mix-blend-multiply md:-right-[14%]"
                    focusable="false"
                  />
                )}

                <div className="relative z-10 mx-auto flex min-h-[620px] w-full max-w-7xl items-center px-4 py-20 md:min-h-[680px] md:px-8">
                  <div className="home-hero-copy max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">
                      {slide.eyebrowText}
                    </p>
                    <Heading className="home-page-heading mt-5 text-5xl font-normal leading-tight tracking-tight text-white md:text-7xl">
                      {slide.headingText}
                    </Heading>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
                      {slide.subheadingText}
                    </p>
                    <div className="mt-9 flex flex-wrap gap-3">
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-blue-50"
                        tabIndex={active ? undefined : -1}
                        to={slide.primaryButtonUrl}
                      >
                        {slide.primaryButtonText}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
                        tabIndex={active ? undefined : -1}
                        to={slide.secondaryButtonUrl}
                      >
                        {slide.secondaryButtonText}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <LoadingScreen label="Loading homepage..." />
        )}

        {heroSlideCount > 1 && (
          <div className="absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 gap-2">
            {hero?.heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show header ${index + 1}`}
                aria-current={
                  index === currentHeroIndex
                    ? "true"
                    : undefined
                }
                onClick={() => setActiveHeroIndex(index)}
                className={`h-2.5 rounded-full border border-white/70 transition-all ${
                  index === currentHeroIndex
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/35 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[0.85fr_1.15fr] md:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">What is KiwiTTR?</p>
          <h2 className="mt-3 text-4xl font-normal tracking-tight text-slate-900">A simpler way to follow table tennis in New Zealand.</h2>
        </div>
        <div className="space-y-4 text-lg leading-8 text-slate-600">
          <p>
            KiwiTTR is an independent rating and competition platform built
            around the people who play and organise table tennis across New
            Zealand.
          </p>
          <p>
            It turns recorded match results into responsive player ratings,
            giving players a useful measure of progress and helping clubs create
            fairer, more engaging competition.
          </p>
          <Link className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900" to="/about">
            More about KiwiTTR <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="text-4xl font-normal tracking-tight">A rating that responds to the result.</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              KiwiTTR considers the rating of both players and the result that
              was expected. A routine win moves the rating a little; an upset
              moves it more. Provisional players adjust faster while the system
              learns their level.
            </p>
            <Link className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-white" to="/how-we-calculate">
              See how ratings are calculated <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <span className="text-slate-400">Expected result</span>
              <span className="font-semibold">Small movement</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 py-5">
              <span className="text-slate-400">Unexpected result</span>
              <span className="font-semibold">Larger movement</span>
            </div>
            <div className="flex items-center justify-between pt-5">
              <span className="text-slate-400">Provisional player</span>
              <span className="font-semibold">Faster adjustment</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Built for the whole community</p>
          <h2 className="mt-3 text-4xl font-normal tracking-tight text-slate-900">Useful for players. Practical for clubs.</h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={title}>
              <div className="flex h-8 items-start">
                <Icon className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="mt-3 min-h-14 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-2 md:px-8">
        <Link className="group flex min-h-56 flex-col rounded-3xl bg-slate-800 p-7 text-white transition hover:bg-slate-900 md:p-9" to="/rankings">
          <div className="flex h-8 items-start">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="mt-12">
            <h2 className="text-3xl font-normal">NZ Rankings</h2>
            <p className="mt-2 text-slate-200">See current player ratings and find where the competition stands.</p>
            <span className="mt-5 inline-flex items-center gap-2 font-semibold">View rankings <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </div>
        </Link>
        <Link className="group flex min-h-56 flex-col rounded-3xl bg-emerald-700 p-7 text-white transition hover:bg-emerald-800 md:p-9" to="/events">
          <div className="flex h-8 items-start">
            <CalendarDays className="h-8 w-8" />
          </div>
          <div className="mt-12">
            <h2 className="text-3xl font-normal">Events and results</h2>
            <p className="mt-2 text-emerald-100">Follow rated competition from table tennis clubs around New Zealand.</p>
            <span className="mt-5 inline-flex items-center gap-2 font-semibold">Browse events <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </div>
        </Link>
      </section>

      <section className="bg-slate-200 py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4 text-left md:px-8">
          <h2 className="max-w-3xl text-4xl font-normal tracking-tight text-slate-900">Ready to make every match count?</h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">Create your KiwiTTR account and connect with New Zealand&apos;s table tennis community.</p>
          <Link className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-800" to="/register">
            Sign up for KiwiTTR <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
