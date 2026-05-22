"use client";

import { useMemo, useRef, useState } from "react";
import { Alert } from "@/components/Alert";
import { IconButton } from "@/components/IconButton";
import { CogIcon } from "@/components/Icons";
import { EditMatchupRecordModal } from "@/features/EditMatchupRecordModal";
import { MatchupChart } from "@/features/MatchupChart";
import { MatchupSettingsModal } from "@/features/MatchupSettingsModal";
import { addRecentArchetype } from "@/utils/matchupSettings";
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
  type MatchupRecord
} from "../../utils/matchupRecords";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_LATEST_SETS
} from "../../utils/matchupSettings";

export default function MatchupRecordsPage() {
  const { records, saveRecord, updateRecord, deleteRecord } =
    useMatchupRecords();
  const { settings, saveSettings } = useMatchupSettings();
  const [userArchetype, setUserArchetype] = useState("");
  const [opponentArchetype, setOpponentArchetype] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "tie" | "">("");
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
  const [userArchetypeFilter, setUserArchetypeFilter] = useState("");
  const [opponentArchetypeFilter, setOpponentArchetypeFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [latestSetFilter, setLatestSetFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<MatchupRecord | null>(null);
  const recordsListRef = useRef<HTMLDivElement>(null);

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
      ? (settings.defaultLatestSet ?? "")
      : latestSetOverrideValue;

  const resultOptions = [
    { value: "win", label: "Win" },
    { value: "loss", label: "Loss" },
    { value: "tie", label: "Tie" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userArchetype) {
      setError("Please select your deck archetype");
      return;
    }

    if (!opponentArchetype) {
      setError("Please select opponent archetype");
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
        result as "win" | "loss" | "tie",
        selectedLatestSetValue.trim() || undefined,
        notes.trim() || undefined,
        selectedFormatValue.trim() || undefined
      );

      // Track recently used archetypes
      addRecentArchetype(userArchetype);
      if (userArchetype.toLowerCase() !== opponentArchetype.toLowerCase()) {
        addRecentArchetype(opponentArchetype);
      }

      // Reset form
      setUserArchetype("");
      setOpponentArchetype("");
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
    const matchesUserArchetype =
      !userArchetypeFilter ||
      record.userArchetype.toLowerCase() === userArchetypeFilter.toLowerCase();
    const matchesOpponentArchetype =
      !opponentArchetypeFilter ||
      record.opponentArchetype.toLowerCase() ===
        opponentArchetypeFilter.toLowerCase();
    const matchesFormat =
      !formatFilter ||
      record.format?.toLowerCase() === formatFilter.toLowerCase();
    const matchesLatestSet =
      !latestSetFilter ||
      record.latestSet?.toLowerCase() === latestSetFilter.toLowerCase();
    return (
      matchesUserArchetype &&
      matchesOpponentArchetype &&
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
              <div>
                {/* replace with the new pkmn selector */}
                <label
                  htmlFor="user-archetype"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Deck Archetype
                </label>
                <Select
                  id="user-archetype"
                  value={userArchetype}
                  onChange={setUserArchetype}
                  groups={archetypeGroups}
                  placeholder="Select your archetype..."
                  disabled={saving}
                  required
                  allowCustom={true}
                />
              </div>

              <div>
                {/* replace with the new pkmn selector */}
                <label
                  htmlFor="opponent-archetype"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Opponent Archetype
                </label>
                <Select
                  id="opponent-archetype"
                  value={opponentArchetype}
                  onChange={setOpponentArchetype}
                  groups={archetypeGroups}
                  placeholder="Select opponent archetype..."
                  disabled={saving}
                  required
                  allowCustom={true}
                />
              </div>

              <div>
                {/* replace with a toggle button group */}
                <label
                  htmlFor="result"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Result
                </label>
                <Select
                  id="result"
                  value={result}
                  onChange={(value) =>
                    setResult(value as "win" | "loss" | "tie" | "")
                  }
                  options={resultOptions}
                  placeholder="Select result..."
                  disabled={saving}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="format"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Format (Optional)
                </label>
                <Select
                  id="format"
                  value={selectedFormatValue}
                  onChange={setFormatOverrideValue}
                  options={formatOptions}
                  placeholder="Select format..."
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="latest-set"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Latest Set
                </label>
                <Select
                  id="latest-set"
                  value={selectedLatestSetValue}
                  onChange={setLatestSetOverrideValue}
                  options={latestSetOptions}
                  placeholder="Select latest set..."
                  disabled={saving}
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
                <div>
                  <label
                    htmlFor="filter-user-archetype"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Filter Your Deck
                  </label>
                  <Select
                    id="filter-user-archetype"
                    value={userArchetypeFilter}
                    onChange={setUserArchetypeFilter}
                    groups={archetypeGroups}
                    placeholder="Select Archetype"
                    allowCustom={true}
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-opponent-archetype"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Filter Opponent Deck
                  </label>
                  <Select
                    id="filter-opponent-archetype"
                    value={opponentArchetypeFilter}
                    onChange={setOpponentArchetypeFilter}
                    groups={archetypeGroups}
                    placeholder="Select Archetype"
                    allowCustom={true}
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-format"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Filter Format
                  </label>
                  <Select
                    id="filter-format"
                    value={formatFilter}
                    onChange={setFormatFilter}
                    options={formatOptions}
                    placeholder="Select Format"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-latest-set"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Filter Latest Set
                  </label>
                  <Select
                    id="filter-latest-set"
                    value={latestSetFilter}
                    onChange={setLatestSetFilter}
                    options={latestSetOptions}
                    placeholder="Select Latest Set"
                  />
                </div>

                {(userArchetypeFilter ||
                  opponentArchetypeFilter ||
                  formatFilter ||
                  latestSetFilter) && (
                  <div className="col-span-full">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setUserArchetypeFilter("");
                        setOpponentArchetypeFilter("");
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
                    setUserArchetypeFilter("");
                    setOpponentArchetypeFilter("");
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
        archetypeGroups={archetypeGroups}
        formatOptions={AVAILABLE_FORMATS}
        latestSetOptions={AVAILABLE_LATEST_SETS}
        onUpdateRecord={updateRecord}
      />
    </div>
  );
}
