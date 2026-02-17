interface AlertProps {
  children?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  intent?: "success" | "error" | "warning" | "info";
  className?: string;
}

const INTENT_STYLES = {
  success: {
    container: "bg-green-50 border-green-200",
    text: "text-green-800"
  },
  error: {
    container: "bg-red-50 border-red-200",
    text: "text-red-800"
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-800"
  },
  info: {
    container: "bg-blue-50 border-blue-200",
    text: "text-blue-800"
  }
};

export function Alert({
  children,
  dismissible = false,
  onDismiss,
  intent = "info",
  className = ""
}: AlertProps) {
  const styles = INTENT_STYLES[intent];

  return (
    <div
      className={`p-3 border rounded-md ${styles.container} ${
        dismissible ? "flex items-start justify-between gap-3" : ""
      } ${className}`}
      role="alert"
    >
      <div className={`${styles.text} text-sm flex-1`}>{children}</div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={`${styles.text} hover:opacity-70 transition-opacity shrink-0`}
          aria-label="Dismiss alert"
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Close Icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
