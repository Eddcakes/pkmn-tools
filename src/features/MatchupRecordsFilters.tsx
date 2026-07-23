import { Button } from "../components/Button";
import {
  PkmnSelector,
  type PkmnSelectorGroup
} from "../components/PkmnSelector";
import { Select, type SelectOption } from "../components/Select";

interface MatchupRecordsFiltersProps {
  userPrimaryPokemonFilter: string;
  setUserPrimaryPokemonFilter: (value: string) => void;
  userSecondaryPokemonFilter: string;
  setUserSecondaryPokemonFilter: (value: string) => void;
  opponentPrimaryPokemonFilter: string;
  setOpponentPrimaryPokemonFilter: (value: string) => void;
  opponentSecondaryPokemonFilter: string;
  setOpponentSecondaryPokemonFilter: (value: string) => void;
  formatFilter: string;
  setFormatFilter: (value: string) => void;
  latestSetFilter: string;
  setLatestSetFilter: (value: string) => void;
  fromDateFilter: string;
  setFromDateFilter: (value: string) => void;
  toDateFilter: string;
  setToDateFilter: (value: string) => void;
  userPrimaryGroups: PkmnSelectorGroup[];
  userSecondaryGroups: PkmnSelectorGroup[];
  opponentPrimaryGroups: PkmnSelectorGroup[];
  opponentSecondaryGroups: PkmnSelectorGroup[];
  formatOptions: SelectOption[];
  latestSetOptions: SelectOption[];
  onClearFilters: () => void;
}

export function MatchupRecordsFilters({
  userPrimaryPokemonFilter,
  setUserPrimaryPokemonFilter,
  userSecondaryPokemonFilter,
  setUserSecondaryPokemonFilter,
  opponentPrimaryPokemonFilter,
  setOpponentPrimaryPokemonFilter,
  opponentSecondaryPokemonFilter,
  setOpponentSecondaryPokemonFilter,
  formatFilter,
  setFormatFilter,
  latestSetFilter,
  setLatestSetFilter,
  fromDateFilter,
  setFromDateFilter,
  toDateFilter,
  setToDateFilter,
  userPrimaryGroups,
  userSecondaryGroups,
  opponentPrimaryGroups,
  opponentSecondaryGroups,
  formatOptions,
  latestSetOptions,
  onClearFilters
}: MatchupRecordsFiltersProps) {
  const hasAnyFilter =
    userPrimaryPokemonFilter ||
    userSecondaryPokemonFilter ||
    opponentPrimaryPokemonFilter ||
    opponentSecondaryPokemonFilter ||
    formatFilter ||
    latestSetFilter ||
    fromDateFilter ||
    toDateFilter;

  return (
    <>
      <div className="col-span-full">
        <p className="block text-sm font-medium text-gray-700 mb-2">
          Your deck
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PkmnSelector
            id="filter-user-primary-pokemon"
            name="filterUserPrimaryPokemon"
            label="Filter User Primary Pokemon"
            hideLabel
            value={userPrimaryPokemonFilter}
            onChange={(value, name) => {
              if (name === "filterUserPrimaryPokemon") {
                setUserPrimaryPokemonFilter(value);
              }
            }}
            groups={userPrimaryGroups}
            placeholder="Filter primary Pokemon"
          />

          <PkmnSelector
            id="filter-user-secondary-pokemon"
            name="filterUserSecondaryPokemon"
            label="Filter User Secondary Pokemon"
            hideLabel
            value={userSecondaryPokemonFilter}
            onChange={(value, name) => {
              if (name === "filterUserSecondaryPokemon") {
                setUserSecondaryPokemonFilter(value);
              }
            }}
            groups={userSecondaryGroups}
            placeholder="Filter secondary Pokemon"
          />
        </div>
      </div>

      <div className="col-span-full">
        <p className="block text-sm font-medium text-gray-700 mb-2">
          Opponent Deck
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PkmnSelector
            id="filter-opponent-primary-pokemon"
            name="filterOpponentPrimaryPokemon"
            label="Filter Opponent Primary Pokemon"
            hideLabel
            value={opponentPrimaryPokemonFilter}
            onChange={(value, name) => {
              if (name === "filterOpponentPrimaryPokemon") {
                setOpponentPrimaryPokemonFilter(value);
              }
            }}
            groups={opponentPrimaryGroups}
            placeholder="Filter primary Pokemon"
          />

          <PkmnSelector
            id="filter-opponent-secondary-pokemon"
            name="filterOpponentSecondaryPokemon"
            label="Filter Opponent Secondary Pokemon"
            hideLabel
            value={opponentSecondaryPokemonFilter}
            onChange={(value, name) => {
              if (name === "filterOpponentSecondaryPokemon") {
                setOpponentSecondaryPokemonFilter(value);
              }
            }}
            groups={opponentSecondaryGroups}
            placeholder="Filter secondary Pokemon"
          />
        </div>
      </div>

      <div className="col-span-full">
        <p className="block text-sm font-medium text-gray-700 mb-2">
          Meta and date
        </p>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            id="filter-format"
            label="Filter Format"
            value={formatFilter}
            onChange={setFormatFilter}
            options={formatOptions}
            placeholder="Select Format"
          />

          <Select
            id="filter-latest-set"
            label="Filter Latest Set"
            value={latestSetFilter}
            onChange={setLatestSetFilter}
            options={latestSetOptions}
            placeholder="Select Latest Set"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="filter-created-after"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              From
            </label>
            <input
              id="filter-created-after"
              type="date"
              value={fromDateFilter}
              onChange={(event) => setFromDateFilter(event.target.value)}
              max={toDateFilter || undefined}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="filter-created-before"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              To
            </label>
            <input
              id="filter-created-before"
              type="date"
              value={toDateFilter}
              onChange={(event) => setToDateFilter(event.target.value)}
              min={fromDateFilter || undefined}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {hasAnyFilter && (
        <div className="col-span-full">
          <Button size="sm" variant="secondary" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </>
  );
}
