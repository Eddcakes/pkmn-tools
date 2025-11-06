import React, { useState, useRef, useEffect } from "react";
import { IconButton } from "./IconButton";
import { ChevronIcon, CrossIcon } from "./Icons";

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
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  allowCustom?: boolean;
}

export function Select({
  id,
  value,
  onChange,
  options,
  groups,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  className = "",
  allowCustom = false
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten all options from groups or use direct options
  const allOptions: SelectOption[] = groups
    ? groups.flatMap((group) => group.options)
    : options || [];

  // Filter options based on search text
  const filteredOptions = allOptions.filter((option) =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  // Filter groups based on search text
  const filteredGroups = groups
    ? groups
        .map((group) => ({
          ...group,
          options: group.options.filter((option) =>
            option.label.toLowerCase().includes(searchText.toLowerCase())
          )
        }))
        .filter((group) => group.options.length > 0)
    : null;

  // Get display label for selected value
  const selectedOption = allOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchText("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchText(text);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleInputBlur = () => {
    // Small delay to allow click on option to register
    setTimeout(() => {
      // Clear search text if no valid option selected
      if (!value && searchText) {
        setSearchText("");
      }
      setIsOpen(false);
    }, 200);
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setSearchText("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange("");
    setSearchText("");
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleAddCustom = () => {
    if (allowCustom && searchText.trim() && filteredOptions.length === 0) {
      onChange(searchText.trim().toLowerCase());
      setSearchText("");
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Home":
        e.preventDefault();
        setHighlightedIndex(0);
        break;

      case "End":
        e.preventDefault();
        setHighlightedIndex(filteredOptions.length - 1);
        break;

      case "Enter":
        e.preventDefault();
        if (
          isOpen &&
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          handleOptionSelect(filteredOptions[highlightedIndex].value);
        } else if (
          allowCustom &&
          searchText.trim() &&
          filteredOptions.length === 0
        ) {
          handleAddCustom();
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchText("");
        inputRef.current?.blur();
        break;

      case "Tab":
        setIsOpen(false);
        setSearchText("");
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center w-full px-3 border border-gray-300 rounded-md bg-white focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={isOpen ? searchText : displayLabel}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className="flex-1 outline-none py-2.5 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex items-center gap-1 shrink-0">
          {/* Clear button */}
          {value && !disabled && (
            <IconButton
              variant="ghost"
              size="xs"
              onClick={handleClear}
              aria-label="Clear selection"
              tabIndex={-1}
              icon={<CrossIcon />}
            />
          )}

          {/* Dropdown indicator */}
          <IconButton
            aria-label="Show options"
            size="xs"
            icon={
              <ChevronIcon
                className={`text-gray-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            }
            onClick={handleInputFocus}
          />
        </div>
      </div>

      {/* Options dropdown */}
      {isOpen && !disabled && (
        <ul
          ref={listRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              {allowCustom && searchText.trim() ? (
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="w-full text-left hover:bg-blue-50 px-2 py-1 rounded"
                >
                  Add "{searchText.trim()}"
                </button>
              ) : (
                "No options found"
              )}
            </li>
          ) : filteredGroups ? (
            // Render grouped options
            <>
              {filteredGroups.map((group, groupIndex) => (
                <React.Fragment key={group.label}>
                  {/* Group header */}
                  <li className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 sticky top-0">
                    {group.label}
                  </li>
                  {/* Group options */}
                  {group.options.map((option) => {
                    const globalIndex = filteredOptions.findIndex(
                      (opt) => opt.value === option.value
                    );
                    return (
                      <li
                        key={option.value}
                        className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                          globalIndex === highlightedIndex
                            ? "bg-blue-50 text-blue-900"
                            : "hover:bg-gray-50"
                        } ${
                          option.value === value
                            ? "bg-blue-100 font-medium"
                            : ""
                        }`}
                        onClick={() => handleOptionSelect(option.value)}
                        onMouseEnter={() => setHighlightedIndex(globalIndex)}
                      >
                        {option.label}
                      </li>
                    );
                  })}
                  {/* Divider between groups (except after last group) */}
                  {groupIndex < filteredGroups.length - 1 && (
                    <li className="border-t border-gray-200 my-1" />
                  )}
                </React.Fragment>
              ))}
            </>
          ) : (
            // Render flat options
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                  index === highlightedIndex
                    ? "bg-blue-50 text-blue-900"
                    : "hover:bg-gray-50"
                } ${option.value === value ? "bg-blue-100 font-medium" : ""}`}
                onClick={() => handleOptionSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
