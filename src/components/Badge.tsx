interface BadgeProps {
  // show vs count, only show if count > 0 - option to show numbers rather than just a dot
  show: boolean;
  children?: React.ReactNode;
  // may need alignment prop in the future, but for now just top right corner
}

export function Badge({ show, children }: BadgeProps) {
  return (
    <span className="relative inline-flex items-center rounded-md  bg-gray-50 text-gray-700">
      {children}
      {show && (
        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-amber-500 translate-x-1/3 -translate-y-1/3"></span>
      )}
    </span>
  );
}
