import { useState, useRef } from "react";

const DEBOUNCE_MS = 300;

export function buildDebouncedHandler(
  onChangeCallback: (filter: string) => void,
  debounceMs = DEBOUNCE_MS
): (value: string) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (value: string) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      onChangeCallback(value ? `title.includes('${value}')` : "");
    }, debounceMs);
  };
}

export default function SearchBar({
  onChange,
}: {
  onChange: (filter: string) => void;
}) {
  const [value, setValue] = useState("");
  const handlerRef = useRef<(v: string) => void>(
    buildDebouncedHandler(onChange)
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    handlerRef.current(next);
  }

  return (
    <input
      value={value}
      onChange={handleChange}
      placeholder="Search posts by title..."
    />
  );
}
