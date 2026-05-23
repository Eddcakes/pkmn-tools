import type { FormEvent } from "react";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ModalFooter } from "../components/ModalFooter";
import { Select } from "../components/Select";
import type { MatchupSettings } from "../utils/matchupSettings";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_LATEST_SETS
} from "../utils/matchupSettings";

interface MatchupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MatchupSettings;
  onSaveSettings: (settings: MatchupSettings) => Promise<void>;
  onUpdated?: () => void;
}

export function MatchupSettingsModal({
  isOpen,
  onClose,
  settings: initialSettings,
  onSaveSettings,
  onUpdated
}: MatchupSettingsModalProps) {
  const [settings, setSettings] = useState<MatchupSettings>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      await onSaveSettings(settings);
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

        {/* Format Default */}
        <div>
          <label
            htmlFor="default-format"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Default Format For New Records
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Optional. Leave blank if you do not want a default.
          </p>
          <Select
            id="default-format"
            value={settings.defaultFormat ?? ""}
            onChange={(value) =>
              setSettings({
                ...settings,
                defaultFormat: value || undefined
              })
            }
            options={AVAILABLE_FORMATS.map((formatOption) => ({
              value: formatOption,
              label: formatOption
            }))}
            placeholder="No default format"
            disabled={isSubmitting}
          />
        </div>

        {/* Latest Set Default */}
        <div>
          <label
            htmlFor="default-latest-set"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Default Latest Set For New Records
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Optional. Leave blank if you do not want a default.
          </p>
          <Select
            id="default-latest-set"
            value={settings.defaultLatestSet ?? ""}
            onChange={(value) =>
              setSettings({
                ...settings,
                defaultLatestSet: value || undefined
              })
            }
            options={AVAILABLE_LATEST_SETS.map((setOption) => ({
              value: setOption,
              label: setOption
            }))}
            placeholder="No default latest set"
            disabled={isSubmitting}
          />
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
