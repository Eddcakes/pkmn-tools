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
import { MatchupRecordsFilters } from "@/features/MatchupRecordsFilters";
import { MatchupRecordsList } from "@/features/MatchupRecordsList";
import { MatchupSettingsModal } from "@/features/MatchupSettingsModal";
import {
  addRecentArchetype,
  updateRecentPokemonSettings
} from "@/utils/matchupSettings";
import { POKEMON_VISIBLE_OPTIONS } from "@/utils/pokemon";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Select } from "../../components/Select";
import { useMatchupRecords } from "../../hooks/useMatchupRecords";
import { useMatchupSettings } from "../../hooks/useMatchupSettings";
import {
  getMatchupChartData,
  type MatchupRecord,
  type MatchupResult
} from "../../utils/matchupRecords";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_LATEST_SETS
} from "../../utils/matchupSettings";

const RESULT_BUTTON_OPTIONS: ButtonGroupOption<MatchupResult>[] = [
  { value: "win", label: "W", ariaLabel: "Win" },
  { value: "loss", label: "L", ariaLabel: "Loss" },
  { value: "tie", label: "T", ariaLabel: "Tie" }
];

const VISIBLE_POKEMON_LOOKUP = new Map(
  POKEMON_VISIBLE_OPTIONS.flatMap((option) => [
    [option.value.toLowerCase(), option.value],
    [option.label.toLowerCase(), option.value]
  ])
);

const startOfLocalDayTimestamp = (dateValue: string): number =>
  new Date(`${dateValue}T00:00:00.000`).getTime();

const endOfLocalDayTimestamp = (dateValue: string): number =>
  new Date(`${dateValue}T23:59:59.999`).getTime();

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
  const [userSecondaryPokemonFilter, setUserSecondaryPokemonFilter] =
    useState("");
  const [opponentPrimaryPokemonFilter, setOpponentPrimaryPokemonFilter] =
    useState("");
  const [opponentSecondaryPokemonFilter, setOpponentSecondaryPokemonFilter] =
    useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [latestSetFilter, setLatestSetFilter] = useState("");
  const [createdAfterFilter, setCreatedAfterFilter] = useState("");
  const [createdBeforeFilter, setCreatedBeforeFilter] = useState("");
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

    return VISIBLE_POKEMON_LOOKUP.get(normalized) ?? null;
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

  const allPokemonOptions = useMemo(() => POKEMON_VISIBLE_OPTIONS, []);

  const pokemonLabelByValue = useMemo(
    () =>
      new Map(allPokemonOptions.map((option) => [option.value, option.label])),
    [allPokemonOptions]
  );

  const buildPokemonGroups = useMemo(
    () =>
      (
        recentValues: string[],
        recentGroupLabel: string
      ): PkmnSelectorGroup[] => {
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
    const createdAtTimestamp = new Date(record.createdAt).getTime();
    const hasValidCreatedAt = Number.isFinite(createdAtTimestamp);
    const matchesCreatedAfter =
      !createdAfterFilter ||
      (hasValidCreatedAt &&
        createdAtTimestamp >= startOfLocalDayTimestamp(createdAfterFilter));
    const matchesCreatedBefore =
      !createdBeforeFilter ||
      (hasValidCreatedAt &&
        createdAtTimestamp <= endOfLocalDayTimestamp(createdBeforeFilter));
    return (
      matchesUserPrimaryPokemon &&
      matchesUserSecondaryPokemon &&
      matchesOpponentPrimaryPokemon &&
      matchesOpponentSecondaryPokemon &&
      matchesFormat &&
      matchesLatestSet &&
      matchesCreatedAfter &&
      matchesCreatedBefore
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

  const clearFilters = () => {
    setUserPrimaryPokemonFilter("");
    setUserSecondaryPokemonFilter("");
    setOpponentPrimaryPokemonFilter("");
    setOpponentSecondaryPokemonFilter("");
    setFormatFilter("");
    setLatestSetFilter("");
    setCreatedAfterFilter("");
    setCreatedBeforeFilter("");
  };

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

        <div className="lg:col-span-2">
          <MatchupRecordsList
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filters={
              <MatchupRecordsFilters
                userPrimaryPokemonFilter={userPrimaryPokemonFilter}
                setUserPrimaryPokemonFilter={setUserPrimaryPokemonFilter}
                userSecondaryPokemonFilter={userSecondaryPokemonFilter}
                setUserSecondaryPokemonFilter={setUserSecondaryPokemonFilter}
                opponentPrimaryPokemonFilter={opponentPrimaryPokemonFilter}
                setOpponentPrimaryPokemonFilter={
                  setOpponentPrimaryPokemonFilter
                }
                opponentSecondaryPokemonFilter={opponentSecondaryPokemonFilter}
                setOpponentSecondaryPokemonFilter={
                  setOpponentSecondaryPokemonFilter
                }
                formatFilter={formatFilter}
                setFormatFilter={setFormatFilter}
                latestSetFilter={latestSetFilter}
                setLatestSetFilter={setLatestSetFilter}
                createdAfterFilter={createdAfterFilter}
                setCreatedAfterFilter={setCreatedAfterFilter}
                createdBeforeFilter={createdBeforeFilter}
                setCreatedBeforeFilter={setCreatedBeforeFilter}
                userPrimaryGroups={userPrimaryGroups}
                userSecondaryGroups={userSecondaryGroups}
                opponentPrimaryGroups={opponentPrimaryGroups}
                opponentSecondaryGroups={opponentSecondaryGroups}
                formatOptions={formatOptions}
                latestSetOptions={latestSetOptions}
                onClearFilters={clearFilters}
              />
            }
            records={records}
            filteredRecords={filteredRecords}
            displayedRecords={displayedRecords}
            hasMoreRecords={hasMoreRecords}
            showAllRecords={showAllRecords}
            setShowAllRecords={setShowAllRecords}
            recordsListRef={recordsListRef}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClearFilters={clearFilters}
          />
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
        userPrimaryGroups={userPrimaryGroups}
        userSecondaryGroups={userSecondaryGroups}
        opponentPrimaryGroups={opponentPrimaryGroups}
        opponentSecondaryGroups={opponentSecondaryGroups}
        formatOptions={AVAILABLE_FORMATS}
        latestSetOptions={AVAILABLE_LATEST_SETS}
        onUpdateRecord={updateRecord}
      />
    </div>
  );
}
