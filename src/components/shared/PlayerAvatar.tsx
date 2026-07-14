import { User } from "lucide-react";

type Props = {
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "profile";
};

export default function PlayerAvatar({
  firstName,
  lastName,
  imageUrl,
  size = "md",
}: Props) {

  const initials = `${firstName?.trim()?.[0] ?? ""}${lastName?.trim()?.[0] ?? ""}`
    .toUpperCase() || "?";

  const sizes = {
    sm: {
      wrapper: "h-8 w-8",
      text: "text-xs",
      icon: "w-4 h-4",
    },

    md: {
      wrapper: "h-10 w-10",
      text: "text-sm",
      icon: "w-5 h-5",
    },

    lg: {
      wrapper: "h-14 w-14",
      text: "text-lg",
      icon: "w-6 h-6",
    },

    xl: {
      wrapper: "h-20 w-20",
      text: "text-2xl",
      icon: "w-8 h-8",
    },

    profile: {
      wrapper: "h-28 w-28",
      text: "text-3xl",
      icon: "h-10 w-10",
    },
  };

  const current = sizes[size];

  return (

    <div
      className={`
        ${current.wrapper}

        shrink-0

        overflow-hidden

        rounded-full

        bg-blue-900

        text-white

        flex
        items-center
        justify-center

        font-bold

        ${current.text}
      `}
    >

      {imageUrl ? (

        <img
          src={imageUrl}
          alt={`${firstName ?? ""} ${lastName ?? ""}`}
          className="h-full w-full object-cover"
        />

      ) : initials !== "?" ? (

        initials

      ) : (

        <User className={current.icon} />

      )}

    </div>

  );

}
