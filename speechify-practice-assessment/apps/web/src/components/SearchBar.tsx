import { useState } from "react";

export default function SearchBar({
  onChange,
}: {
  onChange: (filter: string) => void;
}) {
  const [value, setValue] = useState("");

  // Fires a request to the (expensive) filter endpoint on every keystroke,
  // with no debounce/throttle.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    onChange(next ? `title.includes('${next}')` : "");
  }

  return (
    <input
      value={value}
      onChange={handleChange}
      placeholder="Search posts by title..."
    />
  );
}
