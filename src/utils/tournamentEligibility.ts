import type { PlayerPrivateDetails } from "../services/supabase/playerService";
import type { SavedTournament } from "../types/tournament";

export function hasEligibilityRestrictions(
  tournament: SavedTournament
) {
  return Boolean(
    tournament.settings.ageLimit ||
    tournament.settings.ageMinimum ||
    tournament.settings.gender !== "open" ||
    tournament.settings.ttrLimitEnabled
  );
}

function getAgeOnDate(
  birthDate: string,
  eventDate: string
) {
  const [birthYear, birthMonth, birthDay] =
    birthDate.split("-").map(Number);
  const [eventYear, eventMonth, eventDay] =
    eventDate.split("-").map(Number);

  if (
    !birthYear || !birthMonth || !birthDay ||
    !eventYear || !eventMonth || !eventDay
  ) {
    return null;
  }

  const birthdayHasPassed =
    eventMonth > birthMonth ||
    (eventMonth === birthMonth && eventDay >= birthDay);

  return eventYear - birthYear - (birthdayHasPassed ? 0 : 1);
}

export function getEligibilityReasons(
  tournament: SavedTournament,
  details: PlayerPrivateDetails | null,
  playerRating: number | null
) {
  const reasons: string[] = [];
  const { ageLimit, ageMinimum, gender } =
    tournament.settings;

  if (ageLimit || ageMinimum) {
    if (!details?.birthDate) {
      reasons.push(
        "Add your birthdate in Profile Settings to confirm your age eligibility."
      );
    } else {
      const age = getAgeOnDate(
        details.birthDate,
        tournament.settings.date
      );

      if (age === null) {
        reasons.push(
          "Update your birthdate in Profile Settings to confirm your age eligibility."
        );
      } else {
        if (ageLimit !== null && age >= ageLimit) {
          reasons.push(
            `You are over the U${ageLimit} age limit for this tournament.`
          );
        }

        if (ageMinimum !== null && age < ageMinimum) {
          reasons.push(
            `You are under the O${ageMinimum} age minimum for this tournament.`
          );
        }
      }
    }
  }

  if (gender !== "open") {
    if (!details?.gender) {
      reasons.push(
        "Add your gender in Profile Settings to confirm your eligibility."
      );
    } else if (details.gender !== gender) {
      const category = gender === "female" ? "Female" : "Male";
      reasons.push(
        `Your profile gender does not match this tournament's ${category} category.`
      );
    }
  }

  if (tournament.settings.ttrLimitEnabled) {
    if (playerRating === null) {
      reasons.push(
        "Your current TTR could not be confirmed."
      );
    } else if (playerRating > tournament.settings.ttrLimit) {
      reasons.push(
        `Your current TTR of ${playerRating} is above this tournament's maximum TTR of ${tournament.settings.ttrLimit}.`
      );
    }
  }

  return reasons;
}
