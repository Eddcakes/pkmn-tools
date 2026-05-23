import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ModalFooter } from "../components/ModalFooter";
import { Select, type SelectGroup } from "../components/Select";
import {
  type MatchupRecord,
  updateMatchupRecord
} from "../utils/matchupRecords";

interface EditMatchupRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  record: MatchupRecord | null;
  archetypeGroups: SelectGroup[];
  formatOptions: string[];
  latestSetOptions: string[];
  onUpdateRecord?: (
    id: string,
    updates: Partial<Omit<MatchupRecord, "id" | "createdAt">>
  ) => Promise<unknown>;
}

export function EditMatchupRecordModal({
  isOpen,
  onClose,
  onUpdated,
  record,
  archetypeGroups,
  formatOptions,
  latestSetOptions,
  onUpdateRecord
}: EditMatchupRecordModalProps) {
  const [userArchetype, setUserArchetype] = useState(
    () => record?.userArchetype ?? ""
  );
  const [opponentArchetype, setOpponentArchetype] = useState(
    () => record?.opponentArchetype ?? ""
  );
  const [result, setResult] = useState<"win" | "loss" | "tie" | "">(
    () => record?.result ?? ""
  );
  const [formatValue, setFormatValue] = useState(() => record?.format ?? "");
  const [latestSetValue, setLatestSetValue] = useState(
    () => record?.latestSet ?? ""
  );
  const [notes, setNotes] = useState(() => record?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const resultOptions = [
    { value: "win", label: "Win" },
    { value: "loss", label: "Loss" },
    { value: "tie", label: "Tie" }
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!record) return;

    if (!userArchetype.trim()) {
      setError("Please select your deck archetype");
      return;
    }

    if (!opponentArchetype.trim()) {
      setError("Please select opponent archetype");
      return;
    }

    if (!result) {
      setError("Please select match result");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const updates = {
        userArchetype: userArchetype.trim(),
        opponentArchetype: opponentArchetype.trim(),
        format: formatValue.trim() || undefined,
        latestSet: latestSetValue.trim() || undefined,
        result: result as "win" | "loss" | "tie",
        notes: notes.trim() || undefined
      };
      let updatedRecord: MatchupRecord | boolean | null;
      if (onUpdateRecord) {
        await onUpdateRecord(record.id, updates);
        updatedRecord = true;
      } else {
        updatedRecord = updateMatchupRecord(record.id, updates);
      }

      if (updatedRecord) {
        onUpdated();
        onClose();
      } else {
        setError("Failed to update record - record not found");
      }
    } catch (error) {
      console.error("Error updating matchup record:", error);
      setError("Failed to update record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !record) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Matchup Record"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="edit-user-archetype"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Deck Archetype
          </label>
          <Select
            id="edit-user-archetype"
            value={userArchetype}
            onChange={setUserArchetype}
            groups={archetypeGroups}
            placeholder="Select your archetype..."
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label
            htmlFor="edit-opponent-archetype"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Opponent Archetype
          </label>
          <Select
            id="edit-opponent-archetype"
            value={opponentArchetype}
            onChange={setOpponentArchetype}
            groups={archetypeGroups}
            placeholder="Select opponent archetype..."
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label
            htmlFor="edit-result"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Result
          </label>
          <Select
            id="edit-result"
            value={result}
            onChange={(value) =>
              setResult(value as "win" | "loss" | "tie" | "")
            }
            options={resultOptions}
            placeholder="Select result..."
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label
            htmlFor="edit-format"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Format (Optional)
          </label>
          <Select
            id="edit-format"
            value={formatValue}
            onChange={setFormatValue}
            options={formatOptions.map((formatOption) => ({
              value: formatOption,
              label: formatOption
            }))}
            placeholder="Select format..."
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="edit-latest-set"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Latest Set
          </label>
          <Select
            id="edit-latest-set"
            value={latestSetValue}
            onChange={setLatestSetValue}
            options={latestSetOptions.map((setOption) => ({
              value: setOption,
              label: setOption
            }))}
            placeholder="Select latest set..."
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="edit-notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Notes (Optional)
          </label>
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about the match..."
            disabled={isSubmitting}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !userArchetype.trim() ||
            !opponentArchetype.trim() ||
            !result
          }
        >
          {isSubmitting ? "Updating..." : "Update Record"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
