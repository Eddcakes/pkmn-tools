import type { ReactNode, RefObject } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Tag } from "../components/Tag";
import { archetypeToTagType } from "../utils/archetype";
import {
  formatDate,
  formatFileNameFromDateString
} from "../utils/date";
import type { MatchupRecord } from "../utils/matchupRecords";

interface MatchupRecordsListProps {
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  filters: ReactNode;
  records: MatchupRecord[];
  filteredRecords: MatchupRecord[];
  displayedRecords: MatchupRecord[];
  hasMoreRecords: boolean;
  showAllRecords: boolean;
  setShowAllRecords: (value: boolean) => void;
  recordsListRef: RefObject<HTMLDivElement | null>;
  onEdit: (record: MatchupRecord) => void;
  onDelete: (id: string) => void;
  onClearFilters: () => void;
}

function getResultBadgeColor(result: string) {
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
}

export function MatchupRecordsList({
  showFilters,
  setShowFilters,
  filters,
  records,
  filteredRecords,
  displayedRecords,
  hasMoreRecords,
  showAllRecords,
  setShowAllRecords,
  recordsListRef,
  onEdit,
  onDelete,
  onClearFilters
}: MatchupRecordsListProps) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Records ({filteredRecords.length}
          {filteredRecords.length !== records.length ? ` of ${records.length}` : ""}
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
        <div className="mb-4 pb-4 border-b border-gray-200">{filters}</div>
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
          <Button size="sm" variant="secondary" onClick={onClearFilters}>
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
                      onClick={() => onEdit(record)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(record.id)}
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
                  <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
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
  );
}