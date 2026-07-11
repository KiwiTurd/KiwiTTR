import { Link } from "react-router-dom";

import {
  Building2,
  ChevronRight,
  Database,
  Search,
  Megaphone,
  LayoutPanelTop,
  PanelLeft,
  Home,
  Settings2,
  Shield,
} from "lucide-react";

import useRole from "../hooks/useRole";
import { useSidebar } from "../context/SidebarContext";

export default function Settings() {

  const {
    isAdmin,
    isClubLeader,
  } = useRole();

  const {
    navigationLayout,
    setNavigationLayout,
  } = useSidebar();

  return (

    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}

      <div>

        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">

          <Settings2 className="h-4 w-4" />

          Preferences

        </div>

        <h1 className="mt-4 text-5xl font-normal tracking-tight text-slate-900">

          Settings

        </h1>

        <p className="mt-3 text-lg text-slate-500">

          Choose your navigation layout and access the settings available to your account.

        </p>

      </div>

      {/* Cards */}

      <div className="space-y-4">

        <section className="hidden rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm md:block">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Desktop Navigation</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose how the main navigation is displayed on this device.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              <button
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  navigationLayout === "sidebar"
                    ? "bg-white text-blue-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => setNavigationLayout("sidebar")}
                type="button"
              >
                <PanelLeft className="h-5 w-5" />
                <span>
                  <span className="block text-sm font-bold">Sidebar</span>
                  <span className="block text-xs opacity-70">Default</span>
                </span>
              </button>

              <button
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  navigationLayout === "header"
                    ? "bg-white text-blue-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => setNavigationLayout("header")}
                type="button"
              >
                <LayoutPanelTop className="h-5 w-5" />
                <span>
                  <span className="block text-sm font-bold">Top Header</span>
                  <span className="block text-xs opacity-70">Dropdowns</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        {(isAdmin || isClubLeader) && (

          <Link
            to="/settings/club"
            className="
              group
              block

              rounded-2xl

              border
              border-slate-200

              bg-white

              px-6
              py-5

              shadow-sm

              transition-all

              duration-200

              hover:-translate-y-0.5
              hover:border-blue-200
              hover:shadow-md
            "
          >

            <div className="flex items-center">

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center

                  rounded-xl

                  bg-indigo-100

                  text-indigo-700
                "
              >

                <Building2 className="h-6 w-6" />

              </div>

              <div className="ml-5 flex-1">

                <h2 className="text-xl font-bold">

                  Club Settings

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  Update club info, notices and the public header image.

                </p>

              </div>

              <ChevronRight
                className="
                  h-5
                  w-5

                  text-slate-400

                  transition-transform

                  group-hover:translate-x-1
                "
              />

            </div>

          </Link>

        )}

        {isAdmin && (

          <Link
            to="/settings/notices"
            className="group block rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Megaphone className="h-6 w-6" />
              </div>
              <div className="ml-5 flex-1">
                <h2 className="text-xl font-bold">Notices and News</h2>
                <p className="mt-1 text-sm text-slate-500">Publish dashboard notices and manage previous announcements.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

        )}

        {isAdmin && (

          <Link
            to="/settings/seo"
            className="group block rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Search className="h-6 w-6" />
              </div>
              <div className="ml-5 flex-1">
                <h2 className="text-xl font-bold">SEO Metadata</h2>
                <p className="mt-1 text-sm text-slate-500">Manage page titles, descriptions, keywords and social images.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

        )}

        {isAdmin && (

          <Link
            to="/settings/users"
            className="
              group
              block

              rounded-2xl

              border
              border-slate-200

              bg-white

              px-6
              py-5

              shadow-sm

              transition-all

              duration-200

              hover:-translate-y-0.5
              hover:border-blue-200
              hover:shadow-md
            "
          >

            <div className="flex items-center">

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center

                  rounded-xl

                  bg-blue-100

                  text-blue-800
                "
              >

                <Shield className="h-6 w-6" />

              </div>

              <div className="ml-5 flex-1">

                <h2 className="text-xl font-bold">

                  User Management

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  Manage users, assign club admins and update permissions.

                </p>

              </div>

              <ChevronRight
                className="
                  h-5
                  w-5

                  text-slate-400

                  transition-transform

                  group-hover:translate-x-1
                "
              />

            </div>

          </Link>

        )}

        {/* Competition */}

        <div
          className="
            rounded-2xl

            border
            border-slate-200

            bg-white/70

            px-6
            py-5

            opacity-70
          "
        >

          <div className="flex items-center">

            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center

                rounded-xl

                bg-slate-100

                text-slate-500
              "
            >

              <Settings2 className="h-6 w-6" />

            </div>

            <div className="ml-5 flex-1">

              <h2 className="text-xl font-bold">

                Competition Settings

              </h2>

              <p className="mt-1 text-sm text-slate-500">

                Configure leagues, competitions and seasons.

              </p>

            </div>

            <span
              className="
                rounded-full

                bg-slate-200

                px-3
                py-1

                text-xs
                font-semibold

                uppercase

                tracking-wide
              "
            >

              Coming Soon

            </span>

          </div>

        </div>

        {/* Database */}

        <div
          className="
            rounded-2xl

            border
            border-slate-200

            bg-white/70

            px-6
            py-5

            opacity-70
          "
        >

          <div className="flex items-center">

            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center

                rounded-xl

                bg-slate-100

                text-slate-500
              "
            >

              <Database className="h-6 w-6" />

            </div>

            <div className="ml-5 flex-1">

              <h2 className="text-xl font-bold">

                Database

              </h2>

              <p className="mt-1 text-sm text-slate-500">

                Database maintenance, imports and exports.

              </p>

            </div>

            <span
              className="
                rounded-full

                bg-slate-200

                px-3
                py-1

                text-xs
                font-semibold

                uppercase

                tracking-wide
              "
            >

              Coming Soon

            </span>

          </div>

        </div>

        {isAdmin && (
          <Link
            to="/settings/homepage"
            className="group block rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <Home className="h-6 w-6" />
              </div>
              <div className="ml-5 flex-1">
                <h2 className="text-xl font-bold">Home Page</h2>
                <p className="mt-1 text-sm text-slate-500">Edit the public homepage hero text, buttons and background image.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        )}

      </div>

    </div>

  );

}
