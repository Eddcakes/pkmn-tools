export const BUTTON_VARIANTS = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
  secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
  danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-600 focus:ring-gray-400",
  outline:
    "bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-400"
} as const;

export const BUTTON_SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg"
} as const;

export const BUTTON_BASE_CLASSES =
  "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer inline-flex items-center justify-center";

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

/**
 * Helper function to build button classes with consistent styling
 * @param variant - The button variant (primary, secondary, danger)
 * @param size - The button size (sm, md, lg)
 * @param additionalClasses - Any additional classes to append
 * @returns Combined class string
 */
export function getButtonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  additionalClasses: string = ""
): string {
  return `${BUTTON_BASE_CLASSES} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${additionalClasses}`.trim();
}
