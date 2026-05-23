"use client";
"use no memo";

import { Combobox } from "@base-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  type CSSProperties,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { POKEMON_SEARCH_ENTRIES } from "@/utils/pokemon";
import { CheckIcon, ChevronIcon, CrossIcon } from "./Icons";

export interface PkmnSelectorOption {
  value: string;
  label: string;
}

export interface PkmnSelectorGroup {
  label: string;
  options: PkmnSelectorOption[];
}

interface PkmnSelectorProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string, name?: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  options?: PkmnSelectorOption[];
  groups?: PkmnSelectorGroup[];
  hideLabel?: boolean;
}

export function PkmnSelector({
  id,
  name,
  value,
  onChange,
  label = "Choose a Pokemon",
  placeholder = "e.g. Pikachu",
  disabled = false,
  required = false,
  className = "",
  options,
  groups,
  hideLabel = false
}: PkmnSelectorProps) {
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const virtualizerRef = useRef<VirtualizerHandle | null>(null);

  const renderedGroups = useMemo<PkmnSelectorGroup[]>(() => {
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

    const fallbackOptions =
      options ??
      POKEMON_SEARCH_ENTRIES.map((entry) => ({
        value: entry.value,
        label: entry.label
      }));

    return [
      {
        label: "",
        options: fallbackOptions
      }
    ];
  }, [groups, options]);

  const flattenedItems = useMemo(
    () => renderedGroups.flatMap((group) => group.options),
    [renderedGroups]
  );

  const comboboxGroups = useMemo(
    () =>
      renderedGroups.map((group) => ({
        label: group.label,
        items: group.options
      })),
    [renderedGroups]
  );

  const isGrouped = Boolean(groups?.length);

  const selectedItem =
    flattenedItems.find((entry) => entry.value === value) ?? null;

  return (
    <Combobox.Root
      virtualized
      items={comboboxGroups}
      value={selectedItem}
      onValueChange={(nextItem) => onChange(nextItem?.value ?? "", name)}
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && document.activeElement === inputRef.current) {
          inputRef.current?.blur();
        }

        setOpen(nextOpen);
      }}
      modal={false}
      itemToStringLabel={(item) => (item ? item.label : "")}
      onItemHighlighted={(item, { reason, index }) => {
        const state = virtualizerRef.current;

        if (!item || !state) {
          return;
        }

        const rowIndex = state.itemIndexToRowIndex[index];
        if (rowIndex === undefined) {
          return;
        }

        const isStart = index === 0;
        const isEnd = index === state.itemIndexToRowIndex.length - 1;
        const shouldScroll =
          reason === "none" || (reason === "keyboard" && (isStart || isEnd));

        if (shouldScroll) {
          queueMicrotask(() => {
            state.virtualizer.scrollToIndex(rowIndex, {
              align: isEnd ? "start" : "end"
            });
          });
        }
      }}
      disabled={disabled}
    >
      <div className={`relative ${className}`.trim()}>
        {!hideLabel && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        <Combobox.InputGroup className="flex items-center w-full px-3 border border-gray-300 rounded-md bg-white focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <img
            key={selectedItem?.value ?? "substitute"}
            src={
              selectedItem
                ? `https://r2.limitlesstcg.net/pokemon/gen9/${selectedItem.value}.png`
                : "https://limitless3.nyc3.cdn.digitaloceanspaces.com/pokemon/substitute.png"
            }
            alt={selectedItem?.label ?? "Substitute"}
            className="w-6 h-6 object-contain"
          />

          <Combobox.Separator className="w-px h-5 bg-gray-300 mx-2" />

          <Combobox.Input
            id={inputId}
            ref={inputRef}
            aria-label={hideLabel ? label : undefined}
            name={name}
            placeholder={placeholder}
            required={required}
            className="min-w-0 w-0 flex-1 outline-none py-2.5 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div className="flex items-center gap-1 shrink-0">
            <Combobox.Clear
              className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              aria-label="Clear selection"
            >
              <CrossIcon />
            </Combobox.Clear>

            <Combobox.Trigger
              className="inline-flex items-center justify-center rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 [&[data-popup-open]>svg]:rotate-180"
              aria-label="Open popup"
            >
              <ChevronIcon className="text-gray-400 transition-transform" />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner
            className="z-60 mt-1 outline-none"
            sideOffset={4}
          >
            <Combobox.Popup className="w-(--anchor-width) max-w-(--available-width) bg-white border border-gray-300 rounded-md shadow-lg text-gray-900">
              <Combobox.Empty className="px-3 text-sm text-gray-500">
                No Pokemon found.
              </Combobox.Empty>

              <Combobox.List className="p-0">
                <VirtualizedList
                  open={open}
                  virtualizerRef={virtualizerRef}
                  isGrouped={isGrouped}
                />
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </div>
    </Combobox.Root>
  );
}

type FilteredGroup = {
  label: string;
  items: PkmnSelectorOption[];
};

type VirtualRow =
  | {
      type: "group-label";
      key: string;
      label: string;
    }
  | {
      type: "item";
      key: string;
      item: PkmnSelectorOption;
      ariaPosInset: number;
      ariaSetSize: number;
    };

function VirtualizedList({
  open,
  virtualizerRef,
  isGrouped
}: {
  open: boolean;
  virtualizerRef: { current: VirtualizerHandle | null };
  isGrouped: boolean;
}) {
  "use no memo";

  const filteredGroups = Combobox.useFilteredItems<FilteredGroup>();
  const scrollElementRef = useRef<HTMLDivElement | null>(null);

  const { rows, itemIndexToRowIndex } = useMemo(() => {
    const nextRows: VirtualRow[] = [];
    const nextItemIndexToRowIndex: number[] = [];

    const totalItemCount = filteredGroups.reduce(
      (total, group) => total + group.items.length,
      0
    );

    let itemIndex = 0;

    filteredGroups.forEach((group, groupIndex) => {
      if (isGrouped && group.items.length > 0) {
        nextRows.push({
          type: "group-label",
          key: `group-${group.label}-${groupIndex}`,
          label: group.label
        });
      }

      group.items.forEach((item) => {
        nextRows.push({
          type: "item",
          key: `item-${item.value}`,
          item,
          ariaPosInset: itemIndex + 1,
          ariaSetSize: totalItemCount
        });
        nextItemIndexToRowIndex.push(nextRows.length - 1);
        itemIndex += 1;
      });
    });

    return {
      rows: nextRows,
      itemIndexToRowIndex: nextItemIndexToRowIndex
    };
  }, [filteredGroups, isGrouped]);

  const virtualizer = useVirtualizer({
    enabled: open,
    count: rows.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: (index) => (rows[index]?.type === "group-label" ? 32 : 40),
    overscan: 10,
    paddingStart: 4,
    paddingEnd: 4,
    scrollPaddingStart: 4,
    scrollPaddingEnd: 4
  });

  virtualizerRef.current = {
    virtualizer,
    itemIndexToRowIndex
  };

  const handleScrollElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element;
      if (element) {
        virtualizer.measure();
      }
    },
    [virtualizer]
  );

  const totalSize = virtualizer.getTotalSize();

  if (!rows.length) {
    return null;
  }

  return (
    <div
      role="presentation"
      ref={handleScrollElementRef}
      className="h-[min(22.5rem,var(--total-size))] max-h-(--available-height) overflow-auto overscroll-contain scroll-py-1"
      style={{ "--total-size": `${totalSize}px` } as CSSProperties}
    >
      <div
        role="presentation"
        className="relative w-full"
        style={{ height: totalSize }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const row = rows[virtualItem.index];
          if (!row) {
            return null;
          }

          if (row.type === "group-label") {
            return (
              <div
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                className="pointer-events-none px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`
                }}
              >
                {row.label}
              </div>
            );
          }

          return (
            <Combobox.Item
              key={virtualItem.key}
              index={row.ariaPosInset - 1}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              value={row.item}
              className="grid cursor-default grid-cols-[1rem_2rem_1fr] items-center gap-2 px-3 py-2 text-sm leading-4 outline-none select-none transition-colors hover:bg-gray-50 data-highlighted:bg-blue-50 data-highlighted:text-blue-900 data-selected:bg-blue-100 data-selected:font-medium"
              aria-setsize={row.ariaSetSize}
              aria-posinset={row.ariaPosInset}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <Combobox.ItemIndicator className="col-start-1 text-blue-700">
                <CheckIcon />
              </Combobox.ItemIndicator>

              <img
                src={`https://r2.limitlesstcg.net/pokemon/gen9/${row.item.value}.png`}
                alt={row.item.label}
                className="col-start-2 h-6 w-6 object-contain"
              />

              <span className="col-start-3">{row.item.label}</span>
            </Combobox.Item>
          );
        })}
      </div>
    </div>
  );
}

type Virtualizer = ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;

type VirtualizerHandle = {
  virtualizer: Virtualizer;
  itemIndexToRowIndex: number[];
};
