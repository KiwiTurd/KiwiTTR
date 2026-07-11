import { Pencil, Save, Trash2 } from "lucide-react";

type Props = {
  index: number;

  player1Score: number;
  player2Score: number;

  onPlayer1Change: (value: number) => void;
  onPlayer2Change: (value: number) => void;
  onRemove: () => void;
  canRemove: boolean;
  saved: boolean;
  onSave: () => void;
  onEdit: () => void;
};

export default function SetScoreInput({
  index,
  player1Score,
  player2Score,
  onPlayer1Change,
  onPlayer2Change,
  onRemove,
  canRemove,
  saved,
  onSave,
  onEdit,
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
    <div className={`grid grid-cols-[minmax(44px,1fr)_56px_56px_36px_36px] items-center gap-1.5 rounded-lg px-2 py-1.5 sm:grid-cols-[minmax(72px,1fr)_96px_96px_40px_40px] ${saved ? "bg-slate-50" : "bg-blue-50"}`}>

      <div className="text-sm font-semibold text-slate-700">
        S{index + 1}
      </div>

      {saved ? (
        <>
          <div className="rounded-md border bg-white px-1 py-1.5 text-center text-sm font-semibold">{player1Score}</div>
          <div className="rounded-md border bg-white px-1 py-1.5 text-center text-sm font-semibold">{player2Score}</div>
          <button aria-label={`Edit set ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-green-200 bg-white text-green-700 transition hover:border-slate-400 hover:text-slate-900" onClick={onEdit} title="Edit set" type="button">
            <Pencil className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={displayScore(player1Score)}
            onChange={(e) => onPlayer1Change(parseScore(e.target.value))}
            className="min-w-0 rounded-md border border-slate-300 bg-white px-1 py-1.5 text-center text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={displayScore(player2Score)}
            onChange={(e) => onPlayer2Change(parseScore(e.target.value))}
            className="min-w-0 rounded-md border border-slate-300 bg-white px-1 py-1.5 text-center text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          <button aria-label={`Save set ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-900 text-white transition hover:bg-blue-800" onClick={onSave} title="Save set" type="button">
            <Save className="h-4 w-4" />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Remove set ${index + 1}`}
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-md
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
