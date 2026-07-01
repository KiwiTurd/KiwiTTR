type Props = {
  index: number;

  player1Score: number;
  player2Score: number;

  onPlayer1Change: (value: number) => void;
  onPlayer2Change: (value: number) => void;
};

export default function SetScoreInput({
  index,
  player1Score,
  player2Score,
  onPlayer1Change,
  onPlayer2Change,
}: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">

      <div className="font-medium">
        Set {index + 1}
      </div>

      <input
        type="number"
        min={0}
        value={player1Score}
        onChange={(e) =>
          onPlayer1Change(Number(e.target.value))
        }
        className="border rounded-lg p-3 text-center"
      />

      <input
        type="number"
        min={0}
        value={player2Score}
        onChange={(e) =>
          onPlayer2Change(Number(e.target.value))
        }
        className="border rounded-lg p-3 text-center"
      />

    </div>
  );
}