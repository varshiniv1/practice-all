import { useState } from "react";
import { toggleBookmark } from "../api/client";

export default function BookmarkButton({ postId }: { postId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [count, setCount] = useState(0);

  // Nothing prevents this from firing multiple in-flight requests if the
  // user double-clicks (or the network is slow) -- responses can resolve
  // out of order and leave `bookmarked`/`count` out of sync with the
  // server's actual state.
  async function handleClick() {
    const result = await toggleBookmark(postId);
    setBookmarked(result.bookmarked);
    setCount(result.count);
  }

  return (
    <button onClick={handleClick}>
      {bookmarked ? "★ Bookmarked" : "☆ Bookmark"} ({count})
    </button>
  );
}
