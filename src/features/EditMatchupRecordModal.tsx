import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../components/Button";
import { ButtonGroup } from "../components/ButtonGroup";
import { Modal } from "../components/Modal";
import { ModalFooter } from "../components/ModalFooter";
import { PkmnSelector, type PkmnSelectorGroup } from "../components/PkmnSelector";
import { Select } from "../components/Select";
import {
  MATCHUP_RESULT_OPTIONS,
  type MatchupRecord,
  type MatchupResult,
  updateMatchupRecord
} from "../utils/matchupRecords";

interface EditMatchupRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  record: MatchupRecord | null;
  userPrimaryGroups: PkmnSelectorGroup[];
  userSecondaryGroups: PkmnSelectorGroup[];
  opponentPrimaryGroups: PkmnSelectorGroup[];
  opponentSecondaryGroups: PkmnSelectorGroup[];
  formatOptions: string[];
  latestSetOptions: string[];
  onUpdateRecord?: (
    id: string,
    updates: Partial<Omit<MatchupRecord, "id" | "createdAt">>
  ) => Promise<unknown>;
}

function splitPokemonSlots(archetype: string): [string, string] {
  const parts = archetype
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return [parts[0] ?? "", parts[1] ?? ""];
}

function buildDeckLabel(primaryPokemon: string, secondaryPokemon: string) {
  if (!primaryPokemon) {
    return "";
  }

  return secondaryPokemon
    ? `${primaryPokemon} + ${secondaryPokemon}`
    : primaryPokemon;
}

export function EditMatchupRecordModal({
  isOpen,
  onClose,
  onUpdated,
  record,
  userPrimaryGroups,
  userSecondaryGroups,
  opponentPrimaryGroups,
  opponentSecondaryGroups,
  formatOptions,
  latestSetOptions,
  onUpdateRecord
}: EditMatchupRecordModalProps) {
  const [fallbackUserPrimaryPokemon, fallbackUserSecondaryPokemon] =
    splitPokemonSlots(record?.userArchetype ?? "");
  const [fallbackOpponentPrimaryPokemon, fallbackOpponentSecondaryPokemon] =
    splitPokemonSlots(record?.opponentArchetype ?? "");

  const [userPrimaryPokemon, setUserPrimaryPokemon] = useState(
    () => record?.userPrimaryPokemon ?? fallbackUserPrimaryPokemon
  );
  const [userSecondaryPokemon, setUserSecondaryPokemon] = useState(
    () => record?.userSecondaryPokemon ?? fallbackUserSecondaryPokemon
  );
  const [opponentPrimaryPokemon, setOpponentPrimaryPokemon] = useState(
    () => record?.opponentPrimaryPokemon ?? fallbackOpponentPrimaryPokemon
  );
  const [opponentSecondaryPokemon, setOpponentSecondaryPokemon] = useState(
    () =>
      record?.opponentSecondaryPokemon ?? fallbackOpponentSecondaryPokemon
  );
  const [result, setResult] = useState<MatchupResult | "">(
    () => record?.result ?? ""
  );
  const [formatValue, setFormatValue] = useState(() => record?.format ?? "");
  const [latestSetValue, setLatestSetValue] = useState(
    () => record?.latestSet ?? ""
  );
  const [notes, setNotes] = useState(() => record?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleDeckPokemonChange = (value: string, name?: string) => {
    switch (name) {
      case "editUserPrimaryPokemon":
        setUserPrimaryPokemon(value);
        break;
      case "editUserSecondaryPokemon":
        setUserSecondaryPokemon(value);
        break;
      case "editOpponentPrimaryPokemon":
        setOpponentPrimaryPokemon(value);
        break;
      case "editOpponentSecondaryPokemon":
        setOpponentSecondaryPokemon(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!record) return;

    if (!userPrimaryPokemon.trim()) {
      setError("Please select your deck primary Pokemon");
      return;
    }

    if (!opponentPrimaryPokemon.trim()) {
      setError("Please select opponent primary Pokemon");
      return;
    }

    if (!result) {
      setError("Please select match result");
      return;
    }

    if (formatValue.trim() && !latestSetValue.trim()) {
      setError("Please select latest set when format is selected");
      return;
    }

    const userArchetype = buildDeckLabel(userPrimaryPokemon, userSecondaryPokemon);
    const opponentArchetype = buildDeckLabel(
      opponentPrimaryPokemon,
      opponentSecondaryPokemon
    );

    setIsSubmitting(true);
    setError("");

    try {
      const updates = {
        userArchetype: userArchetype.trim(),
        opponentArchetype: opponentArchetype.trim(),
        userPrimaryPokemon: userPrimaryPokemon.trim() || undefined,
        userSecondaryPokemon: userSecondaryPokemon.trim() || undefined,
        opponentPrimaryPokemon: opponentPrimaryPokemon.trim() || undefined,
        opponentSecondaryPokemon: opponentSecondaryPokemon.trim() || undefined,
        format: formatValue.trim() || undefined,
        latestSet: latestSetValue.trim() || undefined,
        result,
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

        <div className="grid gap-2">
          <p className="block text-sm font-medium text-gray-700">Your Deck</p>
          <PkmnSelector
            id="edit-user-primary-pokemon"
            name="editUserPrimaryPokemon"
            value={userPrimaryPokemon}
            onChange={handleDeckPokemonChange}
            groups={userPrimaryGroups}
            label="Primary Pokemon"
            hideLabel
            placeholder="Choose primary Pokemon..."
            disabled={isSubmitting}
            required
          />
          <PkmnSelector
            id="edit-user-secondary-pokemon"
            name="editUserSecondaryPokemon"
            value={userSecondaryPokemon}
            onChange={handleDeckPokemonChange}
            groups={userSecondaryGroups}
            label="Secondary Pokemon (Optional)"
            hideLabel
            placeholder="Choose secondary Pokemon..."
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-2">
          <p className="block text-sm font-medium text-gray-700">Opponent Deck</p>
          <PkmnSelector
            id="edit-opponent-primary-pokemon"
            name="editOpponentPrimaryPokemon"
            value={opponentPrimaryPokemon}
            onChange={handleDeckPokemonChange}
            groups={opponentPrimaryGroups}
            label="Primary Pokemon"
            hideLabel
            placeholder="Choose primary Pokemon..."
            disabled={isSubmitting}
            required
          />
          <PkmnSelector
            id="edit-opponent-secondary-pokemon"
            name="editOpponentSecondaryPokemon"
            value={opponentSecondaryPokemon}
            onChange={handleDeckPokemonChange}
            groups={opponentSecondaryGroups}
            label="Secondary Pokemon (Optional)"
            hideLabel
            placeholder="Choose secondary Pokemon..."
            disabled={isSubmitting}
          />
        </div>

        <div>
          <p
            id="edit-result-label"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Result
          </p>
          <ButtonGroup
            id="edit-result"
            name="editResult"
            ariaLabelledBy="edit-result-label"
            ariaLabel="Match result"
            className="mt-2"
            value={result}
            onChange={setResult}
            options={MATCHUP_RESULT_OPTIONS}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Select
            id="edit-format"
            label="Format (Optional)"
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
          <Select
            id="edit-latest-set"
            label="Latest Set"
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
            !userPrimaryPokemon.trim() ||
            !opponentPrimaryPokemon.trim() ||
            !result
          }
        >
          {isSubmitting ? "Updating..." : "Update Record"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
