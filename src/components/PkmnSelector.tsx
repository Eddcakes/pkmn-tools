"use client";
"use no memo";

import { Combobox } from "@base-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  type ComponentProps,
  type CSSProperties,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import {
  POKEMON_SEARCH_ENTRIES,
  type PokemonSearchEntry
} from "@/utils/pokemon";
import { ChevronIcon, CrossIcon } from "./Icons";

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
  topGroupValues?: string[];
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
  topGroupValues,
  hideLabel = false
}: PkmnSelectorProps) {
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const virtualizerRef = useRef<Virtualizer | null>(null);

  const orderedItems = useMemo(() => {
    if (!topGroupValues?.length) {
      return POKEMON_SEARCH_ENTRIES;
    }

    const normalizedTopGroupValues = new Set(
      topGroupValues
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0)
    );

    if (!normalizedTopGroupValues.size) {
      return POKEMON_SEARCH_ENTRIES;
    }

    const topItems: PokemonSearchEntry[] = [];
    const remainingItems: PokemonSearchEntry[] = [];

    for (const entry of POKEMON_SEARCH_ENTRIES) {
      const normalizedValue = entry.value.toLowerCase();
      const normalizedLabel = entry.label.toLowerCase();

      if (
        normalizedTopGroupValues.has(normalizedValue) ||
        normalizedTopGroupValues.has(normalizedLabel)
      ) {
        topItems.push(entry);
      } else {
        remainingItems.push(entry);
      }
    }

    return [...topItems, ...remainingItems];
  }, [topGroupValues]);

  const selectedItem =
    orderedItems.find((entry) => entry.value === value) ?? null;

  return (
    <Combobox.Root
      virtualized
      items={orderedItems}
      value={selectedItem}
      onValueChange={(nextItem) => onChange(nextItem?.value ?? "", name)}
      open={open}
      onOpenChange={setOpen}
      itemToStringLabel={(item) => (item ? item.label : "")}
      onItemHighlighted={(item, { reason, index }) => {
        const virtualizer = virtualizerRef.current;

        if (!item || !virtualizer) {
          return;
        }

        const isStart = index === 0;
        const isEnd = index === virtualizer.options.count - 1;
        const shouldScroll =
          reason === "none" || (reason === "keyboard" && (isStart || isEnd));

        if (shouldScroll) {
          queueMicrotask(() => {
            virtualizer.scrollToIndex(index, {
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
            className="z-10 mt-1 outline-none"
            sideOffset={4}
          >
            <Combobox.Popup className="w-(--anchor-width) max-w-(--available-width) bg-white border border-gray-300 rounded-md shadow-lg text-gray-900">
              <Combobox.Empty className="px-3 py-2 text-sm text-gray-500">
                No Pokemon found.
              </Combobox.Empty>

              <Combobox.List className="p-0">
                <VirtualizedList
                  open={open}
                  virtualizerRef={virtualizerRef}
                  topGroupValues={topGroupValues}
                />
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </div>
    </Combobox.Root>
  );
}

function VirtualizedList({
  open,
  virtualizerRef,
  topGroupValues
}: {
  open: boolean;
  virtualizerRef: { current: Virtualizer | null };
  topGroupValues?: string[];
}) {
  const filteredItems = Combobox.useFilteredItems<PokemonSearchEntry>();
  const scrollElementRef = useRef<HTMLDivElement | null>(null);

  const normalizedTopGroupValues = useMemo(
    () =>
      new Set(
        (topGroupValues ?? [])
          .map((item) => item.trim().toLowerCase())
          .filter((item) => item.length > 0)
      ),
    [topGroupValues]
  );

  const topFilteredCount = useMemo(() => {
    if (!normalizedTopGroupValues.size) {
      return 0;
    }

    let count = 0;

    for (const item of filteredItems) {
      const isTopItem =
        normalizedTopGroupValues.has(item.value.toLowerCase()) ||
        normalizedTopGroupValues.has(item.label.toLowerCase());

      if (isTopItem) {
        count += 1;
        continue;
      }

      break;
    }

    return count;
  }, [filteredItems, normalizedTopGroupValues]);

  const showTopGroupSeparator =
    topFilteredCount > 0 && topFilteredCount < filteredItems.length;
  const separatorTop = 4 + topFilteredCount * 40;

  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 40,
    overscan: 10,
    paddingStart: 4,
    paddingEnd: 4,
    scrollPaddingStart: 4,
    scrollPaddingEnd: 4
  });

  virtualizerRef.current = virtualizer;

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

  if (!filteredItems.length) {
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
        {showTopGroupSeparator && (
          <Combobox.Separator
            className="pointer-events-none absolute left-3 right-3 h-px bg-gray-200"
            style={{ top: separatorTop }}
          />
        )}

        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = filteredItems[virtualItem.index];

          if (!item) {
            return null;
          }

          return (
            <Combobox.Item
              key={virtualItem.key}
              index={virtualItem.index}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              value={item}
              className="grid cursor-default grid-cols-[1rem_2rem_1fr] items-center gap-2 px-3 py-2 text-sm leading-4 outline-none select-none transition-colors hover:bg-gray-50 data-highlighted:bg-blue-50 data-highlighted:text-blue-900 data-selected:bg-blue-100 data-selected:font-medium"
              aria-setsize={filteredItems.length}
              aria-posinset={virtualItem.index + 1}
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
                key={item.value}
                src={`https://r2.limitlesstcg.net/pokemon/gen9/${item.value}.png`}
                alt={item.label}
                className="col-start-2 h-6 w-6 object-contain"
              />

              <span className="col-start-3">{item.label}</span>
            </Combobox.Item>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: "block", ...props.style }}
    >
      <title>Check</title>
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

type Virtualizer = ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
