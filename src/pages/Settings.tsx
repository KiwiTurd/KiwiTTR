import { Link } from "react-router-dom";

import {
  Building2,
  ChevronRight,
  Database,
  Settings2,
  Shield,
} from "lucide-react";

import useRole from "../hooks/useRole";

export default function Settings() {

  const {
    isAdmin,
    isClubLeader,
  } = useRole();

  return (

    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}

      <div>

        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">

          <Settings2 className="h-4 w-4" />

          System

        </div>

        <h1 className="mt-4 text-5xl font-black tracking-tight">

          Settings

        </h1>

        <p className="mt-3 text-lg text-slate-500">

          Configure KiwiTTR and manage administrative functions.

        </p>

      </div>

      {/* Cards */}

      <div className="space-y-4">

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

      </div>

    </div>

  );

}
