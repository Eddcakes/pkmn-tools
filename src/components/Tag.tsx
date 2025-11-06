const colourMapping = {
  grass: "bg-green-50 text-green-700 inset-ring-green-600/20",
  fire: "bg-red-50 text-red-700 inset-ring-red-600/10",
  water: "bg-blue-50 text-blue-700 inset-ring-blue-700/10",
  lightning: "bg-yellow-50 text-yellow-800 inset-ring-yellow-600/20",
  fighting: "bg-amber-50 text-amber-800 inset-ring-amber-600/20",
  psychic: "bg-purple-50 text-purple-700 inset-ring-purple-700/10",
  colorless: "bg-stone-50 text-stone-400 inset-ring-stone-500/10",
  darkness: "bg-slate-50 text-slate-600 inset-ring-slate-500/10",
  metal: "bg-zinc-50 text-zinc-400 inset-ring-zinc-500/10",
  dragon: "bg-indigo-50 text-indigo-700 inset-ring-indigo-700/10"
};

export type TagType = keyof typeof colourMapping;

interface TagProps {
  label: string;
  type?: TagType;
}

export function Tag({ label, type }: TagProps) {
  const classesArray = Object.values(colourMapping);
  const tagColour = type
    ? colourMapping[type]
    : classesArray[classesArray.length % label.length];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium inset-ring ${tagColour}`}
    >
      {label}
    </span>
  );
}
