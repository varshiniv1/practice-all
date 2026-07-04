import { useEffect, useState } from "react";
import { fetchPosts } from "../api/client";
import BookmarkButton from "./BookmarkButton";

interface FeedPost {
  id: string;
  title: string;
  body: string;
  author: { username: string } | null;
}

export default function PostList({ filter }: { filter: string }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    fetchPosts(filter).then(setPosts);
  }, [filter]);

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <h3>{post.title}</h3>
          <p>by {post.author?.username ?? "unknown"}</p>
          {/* Post bodies can contain arbitrary HTML from other users. */}
          <div dangerouslySetInnerHTML={{ __html: post.body }} />
          <BookmarkButton postId={post.id} />
        </li>
      ))}
    </ul>
  );
}
