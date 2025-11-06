import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { CrossIcon } from "../components/Icons";
import { Modal } from "../components/Modal";
import { ModalFooter } from "../components/ModalFooter";
import { Select } from "../components/Select";
import { Tag } from "../components/Tag";
import { archetypeMapping, archetypeToTagType } from "../utils/archetype";
import {
  getMatchupSettings,
  type MatchupSettings,
  saveMatchupSettings
} from "../utils/matchupSettings";

interface MatchupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function MatchupSettingsModal({
  isOpen,
  onClose,
  onUpdated
}: MatchupSettingsModalProps) {
  const [settings, setSettings] = useState<MatchupSettings>({
    useRecentArchetypes: true,
    useFavouriteArchetypes: false,
    recentArchetypes: [],
    favouriteArchetypes: [],
    customArchetypes: ""
  });
  const [newFavourite, setNewFavourite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      const loadedSettings = getMatchupSettings();
      setSettings(loadedSettings);
      setNewFavourite("");
      setError("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  const handleAddFavourite = () => {
    if (!newFavourite) return;

    if (settings.favouriteArchetypes.length >= 5) {
      setError("You can only have 5 favourite archetypes");
      return;
    }

    if (
      settings.favouriteArchetypes.some(
        (a) => a.toLowerCase() === newFavourite.toLowerCase()
      )
    ) {
      setError("This archetype is already in your favourites");
      return;
    }

    setSettings({
      ...settings,
      favouriteArchetypes: [...settings.favouriteArchetypes, newFavourite]
    });
    setNewFavourite("");
    setError("");
  };

  const handleRemoveFavourite = (archetype: string) => {
    setSettings({
      ...settings,
      favouriteArchetypes: settings.favouriteArchetypes.filter(
        (a) => a !== archetype
      )
    });
  };

  const handleClearRecent = () => {
    if (window.confirm("Are you sure you want to clear recent archetypes?")) {
      setSettings({
        ...settings,
        recentArchetypes: []
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      saveMatchupSettings(settings);
      setSuccessMessage("Settings saved successfully!");
      setTimeout(() => {
        onUpdated?.();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const archetypeOptions = Object.keys(archetypeMapping)
    .sort()
    .map((archetype) => ({
      value: archetype,
      label: archetype.charAt(0).toUpperCase() + archetype.slice(1)
    }));

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Matchup Record Settings"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="mb-4"
          >
            {successMessage}
          </Alert>
        )}

        {/* Recent Archetypes Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={settings.useRecentArchetypes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    useRecentArchetypes: e.target.checked
                  })
                }
                disabled={isSubmitting}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              Use Recent Archetypes (Last 5)
            </label>
            {settings.recentArchetypes.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearRecent}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-3 ml-6">
            Automatically tracked when you add matchup records
          </p>
          {settings.recentArchetypes.length === 0 ? (
            <p className="text-sm text-gray-400 italic ml-6">
              No recent archetypes yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 ml-6">
              {settings.recentArchetypes.map((archetype) => (
                <Tag
                  key={archetype}
                  label={archetype}
                  type={archetypeToTagType(archetype)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Favourite Archetypes Section */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <input
              type="checkbox"
              checked={settings.useFavouriteArchetypes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  useFavouriteArchetypes: e.target.checked
                })
              }
              disabled={isSubmitting}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            Use Favourite Archetypes (Max 5)
          </label>
          <p className="text-xs text-gray-500 mb-3 ml-6">
            Quick access to your most played archetypes
          </p>

          {settings.favouriteArchetypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 ml-6">
              {settings.favouriteArchetypes.map((archetype) => (
                <div key={archetype} className="flex items-center gap-1">
                  <Tag label={archetype} type={archetypeToTagType(archetype)} />
                  <IconButton
                    variant="ghost"
                    size="xs"
                    onClick={() => handleRemoveFavourite(archetype)}
                    aria-label={`Remove ${archetype}`}
                    disabled={isSubmitting}
                    icon={<CrossIcon />}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 ml-6">
            <Select
              value={newFavourite}
              onChange={setNewFavourite}
              options={archetypeOptions}
              placeholder="Select archetype to add..."
              disabled={
                isSubmitting || settings.favouriteArchetypes.length >= 5
              }
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddFavourite}
              disabled={
                isSubmitting ||
                !newFavourite ||
                settings.favouriteArchetypes.length >= 5
              }
            >
              Add
            </Button>
          </div>
        </div>

        {/* Custom Archetypes Section */}
        <div>
          <label
            htmlFor="custom-archetypes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Custom Archetypes
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Replace default archetype list with your own custom archetypes (one
            per line)
          </p>

          <textarea
            id="custom-archetypes"
            value={settings.customArchetypes}
            onChange={(e) =>
              setSettings({
                ...settings,
                customArchetypes: e.target.value
              })
            }
            placeholder="Enter custom archetypes, one per line&#10;Example:&#10;regidrago&#10;lugia&#10;charizard ex"
            disabled={isSubmitting}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            {
              settings.customArchetypes
                .split("\n")
                .filter((line) => line.trim()).length
            }{" "}
            custom archetype(s)
          </p>
        </div>
      </form>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
