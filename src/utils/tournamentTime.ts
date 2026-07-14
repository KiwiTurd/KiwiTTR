export function formatStartTime(startTime: string) {
  if (!startTime) {
    return "Not set";
  }

  const [hours, minutes] = startTime
    .split(":")
    .map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return startTime;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes));
}
