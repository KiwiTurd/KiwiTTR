import { useEffect, useMemo, useState } from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  getPlayerSearchList,
  type PlayerSearchResult,
} from "../../services/supabase/playerService";

type PlayerSelectorOption = Pick<
  PlayerSearchResult,
  | "id"
  | "firstName"
  | "lastName"
  | "rating"
> & Partial<Pick<PlayerSearchResult, "clubName">>;

interface Props<T extends PlayerSelectorOption> {
  value: T | null;
  onChange: (
    player: T
  ) => void;
  excludePlayerId?: string;
  players?: T[];
  placeholder?: string;
  onClear?: () => void;
  disabled?: boolean;
  showRating?: boolean;
}

export default function PlayerSelector<
  T extends PlayerSelectorOption = PlayerSearchResult,
>({
  value,
  onChange,
  excludePlayerId,
  players: providedPlayers,
  placeholder = "Select Player...",
  onClear,
  disabled = false,
  showRating = true,
}: Props<T>) {
  const [open, setOpen] =
    useState(false);

  const [loadedPlayers, setLoadedPlayers] =
    useState<PlayerSearchResult[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      if (providedPlayers) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const list =
          await getPlayerSearchList();

        setLoadedPlayers(list);

      } finally {
        setLoading(false);
      }
    }

    void load();

  }, [providedPlayers]);

  const players = (
    providedPlayers ?? loadedPlayers
  ) as T[];

  const filteredPlayers =
    useMemo(() => {

      return players.filter(
        (player) =>
          player.id !== excludePlayerId
      );

    }, [
      players,
      excludePlayerId,
    ]);

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(nextOpen) => {
        if (!disabled) {
          setOpen(nextOpen);
        }
      }}
    >
      <PopoverTrigger
  render={
    <Button
      variant="outline"
      disabled={disabled}
      className="
        w-full
        h-auto
        justify-between
        px-4
        py-3
      "
    />
  }
>

  {value ? (

    <div className="min-w-0 flex-1 text-left">

      <p className="truncate font-semibold">

        {value.firstName} {value.lastName}

      </p>

      <p className="truncate text-sm font-medium text-muted-foreground">
        {value.clubName || "Player"}
      </p>

    </div>

  ) : (

    <span className="text-muted-foreground">

      {placeholder}

    </span>

  )}

  <div className="ml-auto flex shrink-0 items-center gap-2">
    {value && showRating && (
      <span className="text-sm font-semibold text-slate-600">
        {value.rating}
      </span>
    )}

    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
  </div>

</PopoverTrigger>

      <PopoverContent
        className="w-[420px] p-0"
        align="start"
      >

        <Command>

          <CommandInput
            placeholder="Search players..."
          />

          <CommandList>

            <CommandEmpty>

              {loading
                ? "Loading..."
                : "No players found."}

            </CommandEmpty>

            <CommandGroup>

              {onClear && value && (
                <CommandItem
                  value="Clear selection"
                  onSelect={() => {
                    onClear();
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">
                    Clear selection
                  </span>
                </CommandItem>
              )}

              {filteredPlayers.map(
                (player) => (

                  <CommandItem
                    key={player.id}
                    value={`${player.firstName} ${player.lastName} ${player.clubName ?? ""}`}
                    onSelect={() => {

                      onChange(player);

                      setOpen(false);

                    }}
                  >
                    <div className="flex-1">

                      <p className="font-medium">

                        {player.firstName}{" "}
                        {player.lastName}

                      </p>

                      <p className="text-xs text-muted-foreground">

                        {player.clubName || "Player"}

                      </p>

                    </div>

                    {showRating && (
                      <div className="mr-3 text-right">

                        <p className="font-semibold">

                          {player.rating}

                        </p>

                      </div>
                    )}

                    <Check
                      className={cn(
                        "h-4 w-4",
                        value?.id === player.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />

                  </CommandItem>

                )
              )}

            </CommandGroup>

          </CommandList>

        </Command>

      </PopoverContent>

    </Popover>
  );
}
