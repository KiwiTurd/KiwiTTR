import type { ReactNode } from "react";

export default function NavigationProfilePicture({
  avatarUrl,
  className,
  fallback,
}: {
  avatarUrl?: string | null;
  className: string;
  fallback: ReactNode;
}) {
  if (!avatarUrl) {
    return fallback;
  }

  return (
    <img
      src={avatarUrl}
      alt="Profile"
      className={`${className} shrink-0 rounded-full object-cover`}
    />
  );
}
