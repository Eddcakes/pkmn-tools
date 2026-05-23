"use client";

import { useMemo, useRef, useState } from "react";
import { Alert } from "@/components/Alert";
import { ButtonGroup, type ButtonGroupOption } from "@/components/ButtonGroup";
import { IconButton } from "@/components/IconButton";
import { CogIcon } from "@/components/Icons";
import {
  PkmnSelector,
  type PkmnSelectorGroup
} from "@/components/PkmnSelector";
import { EditMatchupRecordModal } from "@/features/EditMatchupRecordModal";
import { MatchupChart } from "@/features/MatchupChart";
import { MatchupSettingsModal } from "@/features/MatchupSettingsModal";
import {
  addRecentArchetype,
  updateRecentPokemonSettings
} from "@/utils/matchupSettings";
import { POKEMON_SEARCH_ENTRIES, POKEMON_SEARCH_SET } from "@/utils/pokemon";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Select, type SelectGroup } from "../../components/Select";
import { Tag } from "../../components/Tag";
import { useMatchupRecords } from "../../hooks/useMatchupRecords";
import { useMatchupSettings } from "../../hooks/useMatchupSettings";
import { archetypeMapping, archetypeToTagType } from "../../utils/archetype";
import { formatDate, formatFileNameFromDateString } from "../../utils/date";
import {
  getMatchupChartData,
  type MatchupResult,
  type MatchupRecord
} from "../../utils/matchupRecords";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_LATEST_SETS
} from "../../utils/matchupSettings";

// TODO review component as it is very big
// we may want to look at a new state management solution if this component needs to manage this much state and logic

const RESULT_BUTTON_OPTIONS: ButtonGroupOption<MatchupResult>[] = [
  { value: "win", label: "W", ariaLabel: "Win" },
  { value: "loss", label: "L", ariaLabel: "Loss" },
  { value: "tie", label: "T", ariaLabel: "Tie" }
];

export default function MatchupRecordsPage() {
  const { records, saveRecord, updateRecord, deleteRecord } =
    useMatchupRecords();
  const { settings, saveSettings } = useMatchupSettings();
  const [userPrimaryPokemon, setUserPrimaryPokemon] = useState("");
  const [userSecondaryPokemon, setUserSecondaryPokemon] = useState("");
  const [opponentPrimaryPokemon, setOpponentPrimaryPokemon] = useState("");
  const [opponentSecondaryPokemon, setOpponentSecondaryPokemon] = useState("");
  const [result, setResult] = useState<MatchupResult | "">("");
  const [formatOverrideValue, setFormatOverrideValue] = useState<string | null>(
    null
  );
  const [latestSetOverrideValue, setLatestSetOverrideValue] = useState<
    string | null
  >(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [userPrimaryPokemonFilter, setUserPrimaryPokemonFilter] = useState("");
  const [userSecondaryPokemonFilter, setUserSecondaryPokemonFilter] = useState("");
  const [opponentPrimaryPokemonFilter, setOpponentPrimaryPokemonFilter] =
    useState("");
  const [opponentSecondaryPokemonFilter, setOpponentSecondaryPokemonFilter] =
    useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [latestSetFilter, setLatestSetFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<MatchupRecord | null>(null);
  const recordsListRef = useRef<HTMLDivElement>(null);

  const deckPokemonSetters = {
    userPrimaryPokemon: setUserPrimaryPokemon,
    userSecondaryPokemon: setUserSecondaryPokemon,
    opponentPrimaryPokemon: setOpponentPrimaryPokemon,
    opponentSecondaryPokemon: setOpponentSecondaryPokemon
  };

  type DeckPokemonField = keyof typeof deckPokemonSetters;

  const normalizePokemonValue = (value: string): string | null => {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return "";
    }

    if (!POKEMON_SEARCH_SET.has(normalized)) {
      return null;
    }

    const matchedOption = POKEMON_SEARCH_ENTRIES.find(
      (option) =>
        option.value.toLowerCase() === normalized ||
        option.label.toLowerCase() === normalized
    );

    return matchedOption?.value ?? null;
  };

  const handleDeckPokemonChange = (value: string, fieldName?: string) => {
    if (!fieldName || !(fieldName in deckPokemonSetters)) {
      return;
    }

    const normalizedPokemonValue = normalizePokemonValue(value);
    if (normalizedPokemonValue === null) {
      return;
    }

    deckPokemonSetters[fieldName as DeckPokemonField](normalizedPokemonValue);
  };

  const buildDeckLabel = (primaryPokemon: string, secondaryPokemon: string) => {
    const selectedPokemon = [primaryPokemon, secondaryPokemon].filter((value) =>
      value.trim()
    );

    return selectedPokemon.join(" + ");
  };

  const archetypeGroups = useMemo<SelectGroup[]>(() => {
    const customArchetypes = settings.customArchetypes
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Determine base archetypes (custom or default)
    const baseArchetypes =
      customArchetypes.length > 0
        ? customArchetypes
        : Object.keys(archetypeMapping);

    // Create option objects
    const allOptions = baseArchetypes.sort().map((archetype) => ({
      value: archetype,
      label: archetype.charAt(0).toUpperCase() + archetype.slice(1)
    }));

    const groups: SelectGroup[] = [];

    // Add Recent Archetypes group if enabled and has items
    if (settings.useRecentArchetypes && settings.recentArchetypes.length > 0) {
      const recentOptions = settings.recentArchetypes
        .map((archetype) => ({
          value: archetype,
          label: archetype.charAt(0).toUpperCase() + archetype.slice(1)
        }))
        .filter((option) =>
          allOptions.some((opt) => opt.value === option.value)
        );

      if (recentOptions.length > 0) {
        groups.push({
          label: "Recent",
          options: recentOptions
        });
      }
    }

    // Add Favourite Archetypes group if enabled and has items
    if (
      settings.useFavouriteArchetypes &&
      settings.favouriteArchetypes.length > 0
    ) {
      const favouriteOptions = settings.favouriteArchetypes
        .map((archetype) => ({
          value: archetype,
          label: archetype.charAt(0).toUpperCase() + archetype.slice(1)
        }))
        .filter((option) =>
          allOptions.some((opt) => opt.value === option.value)
        );

      if (favouriteOptions.length > 0) {
        groups.push({
          label: "Favourites",
          options: favouriteOptions
        });
      }
    }

    // Add All Archetypes group
    groups.push({
      label: "All Archetypes",
      options: allOptions
    });

    return groups;
  }, [settings]);

  // Sort records by most recent first
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatOptions = useMemo(
    () =>
      AVAILABLE_FORMATS.map((formatOption) => ({
        value: formatOption,
        label: formatOption
      })),
    []
  );
  const latestSetOptions = useMemo(
    () =>
      AVAILABLE_LATEST_SETS.map((setOption) => ({
        value: setOption,
        label: setOption
      })),
    []
  );

  const selectedFormatValue =
    formatOverrideValue === null
      ? (settings.defaultFormat ?? "")
      : formatOverrideValue;
  const selectedLatestSetValue =
    latestSetOverrideValue === null
      ? (settings.defaultSet ?? "")
      : latestSetOverrideValue;

  const allPokemonOptions = useMemo(
    () =>
      POKEMON_SEARCH_ENTRIES.map((entry) => ({
        value: entry.value,
        label: entry.label
      })),
    []
  );

  const pokemonLabelByValue = useMemo(
    () =>
      new Map(POKEMON_SEARCH_ENTRIES.map((entry) => [entry.value, entry.label])),
    []
  );

  const buildPokemonGroups = useMemo(
    () =>
      (recentValues: string[], recentGroupLabel: string): PkmnSelectorGroup[] => {
        const recentOptions = recentValues
          .map((value) => {
            const label = pokemonLabelByValue.get(value);
            return label ? { value, label } : null;
          })
          .filter((option): option is { value: string; label: string } =>
            Boolean(option)
          );

        return [
          ...(recentOptions.length > 0
            ? [
                {
                  label: recentGroupLabel,
                  options: recentOptions
                }
              ]
            : []),
          {
            label: "All Pokemon",
            options: allPokemonOptions
          }
        ];
      },
    [allPokemonOptions, pokemonLabelByValue]
  );

  const userPrimaryGroups = useMemo(
    () => buildPokemonGroups(settings.recentUserPrimary, "Recent"),
    [buildPokemonGroups, settings.recentUserPrimary]
  );

  const userSecondaryGroups = useMemo(
    () => buildPokemonGroups(settings.recentUserSecondary, "Recent"),
    [buildPokemonGroups, settings.recentUserSecondary]
  );

  const opponentPrimaryGroups = useMemo(
    () => buildPokemonGroups(settings.recentOpponentPrimary, "Recent"),
    [buildPokemonGroups, settings.recentOpponentPrimary]
  );

  const opponentSecondaryGroups = useMemo(
    () => buildPokemonGroups(settings.recentOpponentSecondary, "Recent"),
    [buildPokemonGroups, settings.recentOpponentSecondary]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userArchetype = buildDeckLabel(
      userPrimaryPokemon,
      userSecondaryPokemon
    );
    const opponentArchetype = buildDeckLabel(
      opponentPrimaryPokemon,
      opponentSecondaryPokemon
    );

    if (!userArchetype) {
      setError("Please select at least one Pokemon for your deck");
      return;
    }

    if (!opponentArchetype) {
      setError("Please select at least one Pokemon for the opponent deck");
      return;
    }

    if (!result) {
      setError("Please select match result");
      return;
    }

    if (selectedFormatValue.trim() && !selectedLatestSetValue.trim()) {
      setError("Please select latest set when format is selected");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await saveRecord(
        userArchetype,
        opponentArchetype,
        result as MatchupResult,
        userPrimaryPokemon || undefined,
        userSecondaryPokemon || undefined,
        opponentPrimaryPokemon || undefined,
        opponentSecondaryPokemon || undefined,
        selectedLatestSetValue.trim() || undefined,
        notes.trim() || undefined,
        selectedFormatValue.trim() || undefined
      );

      // Track recently used archetypes
      addRecentArchetype(userArchetype);
      if (userArchetype.toLowerCase() !== opponentArchetype.toLowerCase()) {
        addRecentArchetype(opponentArchetype);
      }

      // Track recent Pokemon selections in settings (unique, newest first, max 5)
      const settingsWithRecentPokemon = updateRecentPokemonSettings(settings, {
        userPrimary: userPrimaryPokemon,
        userSecondary: userSecondaryPokemon,
        opponentPrimary: opponentPrimaryPokemon,
        opponentSecondary: opponentSecondaryPokemon
      });
      try {
        await saveSettings(settingsWithRecentPokemon);
      } catch (settingsError) {
        console.error("Failed to save recent Pokemon settings:", settingsError);
      }

      // Reset form
      setOpponentPrimaryPokemon("");
      setOpponentSecondaryPokemon("");
      setResult("");
      setFormatOverrideValue(null);
      setLatestSetOverrideValue(null);
      setNotes("");

      // Scroll the records list to the top
      recordsListRef.current?.scrollTo({ top: 0, behavior: "smooth" });

      setSuccessMessage("Matchup record saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteRecord(id);
        setSuccessMessage("Record deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete record"
        );
      }
    }
  };

  const handleEdit = (record: MatchupRecord) => {
    setRecordToEdit(record);
    setEditModalOpen(true);
  };

  const handleEditUpdated = () => {
    setSuccessMessage("Record updated successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const getResultBadgeColor = (result: string) => {
    switch (result) {
      case "win":
        return "bg-green-100 text-green-800";
      case "loss":
        return "bg-red-100 text-red-800";
      case "tie":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter records based on selected filters
  const filteredRecords = sortedRecords.filter((record) => {
    const matchesUserPrimaryPokemon =
      !userPrimaryPokemonFilter ||
      record.userPrimaryPokemon?.toLowerCase() ===
        userPrimaryPokemonFilter.toLowerCase();
    const matchesUserSecondaryPokemon =
      !userSecondaryPokemonFilter ||
      record.userSecondaryPokemon?.toLowerCase() ===
        userSecondaryPokemonFilter.toLowerCase();
    const matchesOpponentPrimaryPokemon =
      !opponentPrimaryPokemonFilter ||
      record.opponentPrimaryPokemon?.toLowerCase() ===
        opponentPrimaryPokemonFilter.toLowerCase();
    const matchesOpponentSecondaryPokemon =
      !opponentSecondaryPokemonFilter ||
      record.opponentSecondaryPokemon?.toLowerCase() ===
        opponentSecondaryPokemonFilter.toLowerCase();
    const matchesFormat =
      !formatFilter ||
      record.format?.toLowerCase() === formatFilter.toLowerCase();
    const matchesLatestSet =
      !latestSetFilter ||
      record.latestSet?.toLowerCase() === latestSetFilter.toLowerCase();
    return (
      matchesUserPrimaryPokemon &&
      matchesUserSecondaryPokemon &&
      matchesOpponentPrimaryPokemon &&
      matchesOpponentSecondaryPokemon &&
      matchesFormat &&
      matchesLatestSet
    );
  });

  const chartData = useMemo(
    () => getMatchupChartData(filteredRecords),
    [filteredRecords]
  );

  // Get records to display (limited to 5 or all)
  const displayedRecords = showAllRecords
    ? filteredRecords
    : filteredRecords.slice(0, 5);
  const hasMoreRecords = filteredRecords.length > 5;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Matchup Records</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Matchup Record
              </h2>
              <IconButton
                aria-label="Quick settings for matchups"
                icon={<CogIcon />}
                size="sm"
                onClick={() => setSettingsModalOpen(true)}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <p className="block text-sm font-medium text-gray-700">
                  Your Deck
                </p>
                <PkmnSelector
                  id="user-primary-pokemon"
                  name="userPrimaryPokemon"
                  value={userPrimaryPokemon}
                  onChange={handleDeckPokemonChange}
                  groups={userPrimaryGroups}
                  label="Primary Pokemon"
                  hideLabel
                  placeholder="Choose primary Pokemon..."
                  disabled={saving}
                  required
                />

                <PkmnSelector
                  id="user-secondary-pokemon"
                  name="userSecondaryPokemon"
                  value={userSecondaryPokemon}
                  onChange={handleDeckPokemonChange}
                  groups={userSecondaryGroups}
                  label="Secondary Pokemon (Optional)"
                  hideLabel
                  placeholder="Choose secondary Pokemon..."
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2">
                <p className="block text-sm font-medium text-gray-700">
                  Opponent Deck
                </p>
                <PkmnSelector
                  id="opponent-primary-pokemon"
                  name="opponentPrimaryPokemon"
                  value={opponentPrimaryPokemon}
                  onChange={handleDeckPokemonChange}
                  groups={opponentPrimaryGroups}
                  label="Primary Pokemon"
                  hideLabel
                  placeholder="Choose primary Pokemon..."
                  disabled={saving}
                  required
                />

                <PkmnSelector
                  id="opponent-secondary-pokemon"
                  name="opponentSecondaryPokemon"
                  value={opponentSecondaryPokemon}
                  onChange={handleDeckPokemonChange}
                  groups={opponentSecondaryGroups}
                  label="Secondary Pokemon (Optional)"
                  hideLabel
                  placeholder="Choose secondary Pokemon..."
                  disabled={saving}
                />
              </div>

              <div>
                <p
                  id="result-label"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Result
                </p>
                <ButtonGroup
                  id="result"
                  name="result"
                  ariaLabelledBy="result-label"
                  ariaLabel="Match result"
                  className="mt-2"
                  value={result}
                  onChange={setResult}
                  options={RESULT_BUTTON_OPTIONS}
                  disabled={saving}
                />
              </div>

              <div>
                <Select
                  id="format"
                  label="Format (Optional)"
                  value={selectedFormatValue}
                  onChange={setFormatOverrideValue}
                  options={formatOptions}
                  placeholder="Select format..."
                  disabled={saving}
                  description="The default format can be set in settings."
                />
              </div>

              <div>
                <Select
                  id="latest-set"
                  label="Latest Set"
                  value={selectedLatestSetValue}
                  onChange={setLatestSetOverrideValue}
                  options={latestSetOptions}
                  placeholder="Select latest set..."
                  disabled={saving}
                  description="The default latest set can be set in settings."
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the match..."
                  disabled={saving}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Record"}
              </Button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {successMessage && (
                <Alert
                  intent="success"
                  dismissible
                  onDismiss={() => setSuccessMessage("")}
                >
                  {successMessage}
                </Alert>
              )}
            </form>
          </Card>
        </div>

        {/* Records List Section */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Records ({filteredRecords.length}
                {filteredRecords.length !== records.length
                  ? ` of ${records.length}`
                  : ""}
                )
              </h2>
              {records.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? "Hide Filters" : "Filters"}
                </Button>
              )}
            </div>

            {showFilters && records.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
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

                <div>
                  <Select
                    id="filter-format"
                    label="Filter Format"
                    value={formatFilter}
                    onChange={setFormatFilter}
                    options={formatOptions}
                    placeholder="Select Format"
                  />
                </div>

                <div>
                  <Select
                    id="filter-latest-set"
                    label="Filter Latest Set"
                    value={latestSetFilter}
                    onChange={setLatestSetFilter}
                    options={latestSetOptions}
                    placeholder="Select Latest Set"
                  />
                </div>

                {(userPrimaryPokemonFilter ||
                  userSecondaryPokemonFilter ||
                  opponentPrimaryPokemonFilter ||
                  opponentSecondaryPokemonFilter ||
                  formatFilter ||
                  latestSetFilter) && (
                  <div className="col-span-full">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setUserPrimaryPokemonFilter("");
                        setUserSecondaryPokemonFilter("");
                        setOpponentPrimaryPokemonFilter("");
                        setOpponentSecondaryPokemonFilter("");
                        setFormatFilter("");
                        setLatestSetFilter("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}

            {records.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No matchup records yet.</p>
                <p className="text-sm text-gray-400">
                  Add your first matchup record using the form on the left.
                </p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  No records match the selected filters.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setUserPrimaryPokemonFilter("");
                    setUserSecondaryPokemonFilter("");
                    setOpponentPrimaryPokemonFilter("");
                    setOpponentSecondaryPokemonFilter("");
                    setFormatFilter("");
                    setLatestSetFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div
                  ref={recordsListRef}
                  className="space-y-4 max-h-150 overflow-y-auto pr-2"
                >
                  {displayedRecords.map((record) => (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {/* this part here
                            we should think are we still gonna save archetypes in the same way
                            string space string

                            or do we need to store them as an array

                            will they be broken if we try keep the current method?

                            We have things like Alakazam Dudunsparce - will this just be fine?
                          */}
                          <Tag
                            label={record.userArchetype}
                            type={archetypeToTagType(record.userArchetype)}
                          />
                          <span className="text-gray-400">vs</span>
                          <Tag
                            label={record.opponentArchetype}
                            type={archetypeToTagType(record.opponentArchetype)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(record)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(record.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${getResultBadgeColor(
                            record.result
                          )}`}
                        >
                          {record.result}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(record.createdAt)}
                        </span>
                        {record.format && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {record.format}
                          </span>
                        )}
                        {record.latestSet && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase bg-gray-100 text-gray-800">
                            {record.latestSet}
                          </span>
                        )}
                        <span
                          data-file-name-for-syncing
                          className="text-xs text-white"
                        >
                          {formatFileNameFromDateString(record.createdAt)}
                        </span>
                      </div>

                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {hasMoreRecords && !showAllRecords && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAllRecords(true)}
                    >
                      Show More ({filteredRecords.length - 5} more records)
                    </Button>
                  </div>
                )}

                {showAllRecords && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAllRecords(false)}
                    >
                      Show Less
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Matchup Chart Section */}
      {filteredRecords.length > 0 && (
        <div className="mt-8">
          <MatchupChart data={chartData} />
        </div>
      )}

      {/* Settings Modal */}
      <MatchupSettingsModal
        key={settingsModalOpen ? "settings-open" : "settings-closed"}
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={saveSettings}
      />

      {/* Edit Record Modal */}
      <EditMatchupRecordModal
        key={
          editModalOpen
            ? `edit-record-${recordToEdit?.id ?? "none"}`
            : "edit-record-closed"
        }
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setRecordToEdit(null);
        }}
        onUpdated={handleEditUpdated}
        record={recordToEdit}
        formatOptions={AVAILABLE_FORMATS}
        latestSetOptions={AVAILABLE_LATEST_SETS}
        onUpdateRecord={updateRecord}
      />
    </div>
  );
}
