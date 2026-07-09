import type {
  Pool,
  PoolStanding,
  TournamentMatch,
} from "../../types/tournament";

/**
 * Calculates the live standings
 * for a single pool.
 */
export function calculatePoolStandings(
  pool: Pool,
  matches: TournamentMatch[]
): PoolStanding[] {

  const standings: PoolStanding[] =
    pool.players.map((player) => ({

      player,

      wins: 0,

      losses: 0,

      gamesWon: 0,

      gamesLost: 0,

      points: 0,

      position: 0,

    }));

  const poolMatches =
    matches.filter(

      (match) =>

        match.poolId === pool.id &&

        match.completed

    );

  poolMatches.forEach((match) => {

    const playerOne =
      standings.find(

        (standing) =>

          standing.player.id ===
          match.playerOne.id

      );

    const playerTwo =
      standings.find(

        (standing) =>

          standing.player.id ===
          match.playerTwo.id

      );

    if (
      !playerOne ||
      !playerTwo
    ) {

      return;

    }

    let playerOneGames = 0;

    let playerTwoGames = 0;

    match.games.forEach((game) => {

      const [
        scoreOne,
        scoreTwo,
      ] = game
        .split("-")
        .map(Number);

      if (
        scoreOne > scoreTwo
      ) {

        playerOneGames++;

      } else {

        playerTwoGames++;

      }

    });

    playerOne.gamesWon +=
      playerOneGames;

    playerOne.gamesLost +=
      playerTwoGames;

    playerTwo.gamesWon +=
      playerTwoGames;

    playerTwo.gamesLost +=
      playerOneGames;

    if (
      match.winnerId ===
      match.playerOne.id
    ) {

      playerOne.wins++;

      playerOne.points++;

      playerTwo.losses++;

    } else {

      playerTwo.wins++;

      playerTwo.points++;

      playerOne.losses++;

    }

  });

  standings.sort((a, b) => {

    if (
      b.points !==
      a.points
    ) {

      return (
        b.points -
        a.points
      );

    }

    const gameDifferenceA =
      a.gamesWon -
      a.gamesLost;

    const gameDifferenceB =
      b.gamesWon -
      b.gamesLost;

    return (
      gameDifferenceB -
      gameDifferenceA
    );

  });

  standings.forEach(
    (standing, index) => {

      standing.position =
        index + 1;

    }
  );

  return standings;

}