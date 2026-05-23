import { Select as BaseSelect } from "@base-ui/react/select";
import {
  Fragment,
  type MouseEvent,
  useId,
  useMemo,
  useState
} from "react";
import { CheckIcon, ChevronIcon, CrossIcon } from "./Icons";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps {
  id?: string;
  label?: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function Select({
  id,
  label,
  description,
  value,
  onChange,
  options,
  groups,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  className = ""
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = description ? `${selectId}-description` : undefined;

  const renderedGroups = useMemo(() => {
    if (groups?.length) {
      const seenValues = new Set<string>();

      return groups
        .map((group) => ({
          label: group.label,
          options: group.options.filter((option) => {
            if (seenValues.has(option.value)) {
              return false;
            }

            seenValues.add(option.value);
            return true;
          })
        }))
        .filter((group) => group.options.length > 0);
    }

    return [
      {
        label: "",
        options: options ?? []
      }
    ];
  }, [groups, options]);

  const flattenedItems = useMemo(
    () => renderedGroups.flatMap((group) => group.options),
    [renderedGroups]
  );

  const isGrouped = Boolean(groups?.length);
  const hasValue = value.trim().length > 0;

  const handleClear = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <BaseSelect.Root
          id={selectId}
          value={value || null}
          items={flattenedItems}
          onValueChange={(nextValue) => onChange((nextValue as string | null) ?? "")}
          open={open}
          onOpenChange={setOpen}
          required={required}
          disabled={disabled}
        >
          <BaseSelect.Trigger
            aria-describedby={descriptionId}
            className="group flex w-full items-center rounded-md border border-gray-300 bg-white px-3 py-2.5 pr-16 text-left text-sm text-gray-900 outline-none transition-colors focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500 data-popup-open:border-transparent data-popup-open:ring-2 data-popup-open:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BaseSelect.Value
              className="min-w-0 w-0 flex-1 truncate bg-transparent data-placeholder:text-gray-500"
              placeholder={placeholder}
            />
          </BaseSelect.Trigger>

          <div className="pointer-events-none absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 shrink-0">
            {hasValue && !disabled && (
              <button
                type="button"
                onMouseDown={handleClear}
                onClick={handleClear}
                aria-label="Clear selection"
                className="pointer-events-auto inline-flex items-center justify-center rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <CrossIcon />
              </button>
            )}

            <span className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition-colors group-hover:bg-gray-100 group-hover:text-gray-700">
              <ChevronIcon
                className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </span>
          </div>

          <BaseSelect.Portal>
            <BaseSelect.Positioner
              className="z-60 mt-1 outline-none"
              sideOffset={4}
              alignItemWithTrigger={false}
              positionMethod="fixed"
            >
              <BaseSelect.Popup className="w-(--anchor-width) max-w-(--available-width) rounded-md border border-gray-300 bg-white text-gray-900 shadow-lg">
                <BaseSelect.List className="max-h-(--available-height) overflow-auto py-1 outline-none">
                  {renderedGroups.map((group, groupIndex) => (
                    <Fragment key={`${group.label}-${groupIndex}`}>
                      {isGrouped ? (
                        <BaseSelect.Group className="block">
                          <BaseSelect.GroupLabel className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {group.label}
                          </BaseSelect.GroupLabel>

                          {group.options.map((option) => (
                            <BaseSelect.Item
                              key={option.value}
                              value={option.value}
                              className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 px-3 py-2 text-sm outline-none transition-colors data-highlighted:bg-blue-50 data-highlighted:text-blue-900 data-selected:bg-blue-100 data-selected:font-medium"
                            >
                              <BaseSelect.ItemIndicator className="col-start-1 text-blue-700">
                                <CheckIcon />
                              </BaseSelect.ItemIndicator>
                              <BaseSelect.ItemText className="col-start-2">
                                {option.label}
                              </BaseSelect.ItemText>
                            </BaseSelect.Item>
                          ))}
                        </BaseSelect.Group>
                      ) : (
                        group.options.map((option) => (
                          <BaseSelect.Item
                            key={option.value}
                            value={option.value}
                            className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 px-3 py-2 text-sm outline-none transition-colors data-highlighted:bg-blue-50 data-highlighted:text-blue-900 data-selected:bg-blue-100 data-selected:font-medium"
                          >
                            <BaseSelect.ItemIndicator className="col-start-1 text-blue-700">
                              <CheckIcon />
                            </BaseSelect.ItemIndicator>
                            <BaseSelect.ItemText className="col-start-2">
                              {option.label}
                            </BaseSelect.ItemText>
                          </BaseSelect.Item>
                        ))
                      )}

                      {isGrouped && groupIndex < renderedGroups.length - 1 && (
                        <BaseSelect.Separator className="mx-3 my-1 h-px bg-gray-200" />
                      )}
                    </Fragment>
                  ))}
                </BaseSelect.List>
              </BaseSelect.Popup>
            </BaseSelect.Positioner>
          </BaseSelect.Portal>
        </BaseSelect.Root>
      </div>

      {description && (
        <p id={descriptionId} className="mt-2 text-xs text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}
