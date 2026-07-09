import { Trash2 } from "lucide-react";

type Props = {
  index: number;

  player1Score: number;
  player2Score: number;

  onPlayer1Change: (value: number) => void;
  onPlayer2Change: (value: number) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export default function SetScoreInput({
  index,
  player1Score,
  player2Score,
  onPlayer1Change,
  onPlayer2Change,
  onRemove,
  canRemove,
}: Props) {
  function displayScore(score: number) {
    return score === 0
      ? ""
      : String(score);
  }

  function parseScore(value: string) {
    return value === ""
      ? 0
      : Number(value);
  }

  return (
    <div className="grid grid-cols-[minmax(72px,1fr)_96px_96px_44px] items-center gap-3 rounded-xl bg-slate-50 p-3">

      <div className="font-semibold text-slate-700">
        Set {index + 1}
      </div>

      <input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder="0"
        value={displayScore(player1Score)}
        onChange={(e) =>
          onPlayer1Change(
            parseScore(e.target.value)
          )
        }
        className="rounded-xl border border-slate-300 bg-white p-3 text-center outline-none transition placeholder:text-slate-300 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      />

      <input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder="0"
        value={displayScore(player2Score)}
        onChange={(e) =>
          onPlayer2Change(
            parseScore(e.target.value)
          )
        }
        className="rounded-xl border border-slate-300 bg-white p-3 text-center outline-none transition placeholder:text-slate-300 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      />

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Remove set ${index + 1}`}
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          border
          border-slate-300
          text-slate-500
          transition

          hover:border-red-300
          hover:bg-red-50
          hover:text-red-700

          disabled:cursor-not-allowed
          disabled:opacity-40
          disabled:hover:border-slate-300
          disabled:hover:bg-transparent
          disabled:hover:text-slate-500
        "
      >
        <Trash2 className="h-4 w-4" />
      </button>

    </div>
  );
}
