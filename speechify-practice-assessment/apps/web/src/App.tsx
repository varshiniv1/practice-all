import { useState } from "react";
import SearchBar from "./components/SearchBar";
import PostList from "./components/PostList";

export default function App() {
  const [filter, setFilter] = useState("");

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>SnapFeed</h1>
      <SearchBar onChange={setFilter} />
      <PostList filter={filter} />
    </div>
  );
}
