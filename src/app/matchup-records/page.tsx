"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/Button";
import { Link } from "../../components/Link";
import { Select, type SelectGroup } from "../../components/Select";
import { Tag } from "../../components/Tag";
import {
  saveMatchupRecord,
  getMatchupRecords,
  deleteMatchupRecord,
  getMatchupChartData,
  type MatchupRecord,
  type MatchupChartData,
} from "../../utils/matchupRecords";
import { archetypeMapping, archetypeToTagType } from "../../utils/archetype";
import { IconButton } from "@/components/IconButton";
import { CogIcon } from "@/components/Icons";
import { MatchupSettingsModal } from "@/features/MatchupSettingsModal";
import { MatchupChart } from "@/features/MatchupChart";
import {
  addRecentArchetype,
  getCustomArchetypesArray,
  getMatchupSettings,
} from "@/utils/matchupSettings";

export default function MatchupRecordsPage() {
  const [userArchetype, setUserArchetype] = useState("");
  const [opponentArchetype, setOpponentArchetype] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "tie" | "">("");
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState<MatchupRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [archetypeGroups, setArchetypeGroups] = useState<SelectGroup[]>([]);
  const [chartData, setChartData] = useState<MatchupChartData>({
    userArchetypes: [],
    opponentArchetypes: [],
    matrix: new Map(),
  });

  useEffect(() => {
    loadRecords();
    loadArchetypeOptions();
    updateChartData();
  }, []);

  const loadArchetypeOptions = () => {
    const settings = getMatchupSettings();
    const customArchetypes = getCustomArchetypesArray();

    // Determine base archetypes (custom or default)
    const baseArchetypes =
      customArchetypes.length > 0
        ? customArchetypes
        : Object.keys(archetypeMapping);

    // Create option objects
    const allOptions = baseArchetypes.sort().map((archetype) => ({
      value: archetype,
      label: archetype.charAt(0).toUpperCase() + archetype.slice(1),
    }));

    const groups: SelectGroup[] = [];

    // Add Recent Archetypes group if enabled and has items
    if (settings.useRecentArchetypes && settings.recentArchetypes.length > 0) {
      const recentOptions = settings.recentArchetypes
        .map((archetype) => ({
          value: archetype,
          label: archetype.charAt(0).toUpperCase() + archetype.slice(1),
        }))
        .filter((option) =>
          allOptions.some((opt) => opt.value === option.value)
        );

      if (recentOptions.length > 0) {
        groups.push({
          label: "Recent",
          options: recentOptions,
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
          label: archetype.charAt(0).toUpperCase() + archetype.slice(1),
        }))
        .filter((option) =>
          allOptions.some((opt) => opt.value === option.value)
        );

      if (favouriteOptions.length > 0) {
        groups.push({
          label: "Favourites",
          options: favouriteOptions,
        });
      }
    }

    // Add All Archetypes group
    groups.push({
      label: "All Archetypes",
      options: allOptions,
    });

    setArchetypeGroups(groups);
  };

  const loadRecords = () => {
    const loadedRecords = getMatchupRecords();
    // Sort by most recent first
    loadedRecords.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setRecords(loadedRecords);
  };

  const updateChartData = () => {
    const data = getMatchupChartData();
    setChartData(data);
  };

  const resultOptions = [
    { value: "win", label: "Win" },
    { value: "loss", label: "Loss" },
    { value: "tie", label: "Tie" },
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

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      saveMatchupRecord(
        userArchetype,
        opponentArchetype,
        result as "win" | "loss" | "tie",
        notes.trim() || undefined
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
      setNotes("");

      // Reload records
      loadRecords();
      updateChartData();

      setSuccessMessage("Matchup record saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        deleteMatchupRecord(id);
        loadRecords();
        updateChartData();
        setSuccessMessage("Record deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete record"
        );
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Matchup Records</h1>
        <Link href="/">
          <Button variant="secondary">Home</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-8">
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
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">{successMessage}</p>
                </div>
              )}

              <div>
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
            </form>
          </div>
        </div>

        {/* Records List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Records ({records.length})
              {/* do we limit this view to recent records only? (5?) */}
            </h2>

            {records.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No matchup records yet.</p>
                <p className="text-sm text-gray-400">
                  Add your first matchup record using the form on the left.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
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
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(record.id)}
                      >
                        Delete
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultBadgeColor(
                          record.result
                        )}`}
                      >
                        {record.result.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(record.createdAt)}
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
            )}
          </div>
        </div>
      </div>

      {/* Matchup Chart Section */}
      {records.length > 0 && (
        <div className="mt-8">
          <MatchupChart data={chartData} />
        </div>
      )}

      {/* Settings Modal */}
      <MatchupSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onUpdated={() => {
          // Reload archetype options when settings are updated
          loadArchetypeOptions();
        }}
      />
    </div>
  );
}
