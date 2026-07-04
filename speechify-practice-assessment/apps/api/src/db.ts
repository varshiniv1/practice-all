import crypto from "node:crypto";
import type { User, Post } from "@snapfeed/shared/src/types";

// NOTE: this is an in-memory "database" standing in for a real one so the
// practice assessment doesn't require any external services to run.

function weakHash(password: string): string {
  // md5, no salt -- intentionally weak for the exercise
  return crypto.createHash("md5").update(password).digest("hex");
}

export const users: User[] = [
  {
    id: "u1",
    username: "alice",
    email: "alice@example.com",
    passwordHash: weakHash("alice123"),
    bio: "Coffee, code, and cats.",
    isAdmin: false,
  },
  {
    id: "u2",
    username: "bob",
    email: "bob@example.com",
    passwordHash: weakHash("bob123"),
    bio: "Trail runner. Building things.",
    isAdmin: false,
  },
  {
    id: "admin",
    username: "root",
    email: "root@snapfeed.dev",
    passwordHash: weakHash("Admin123!"),
    bio: "System account.",
    isAdmin: true,
  },
];

export const posts: Post[] = Array.from({ length: 40 }).map((_, i) => {
  const author = users[i % 2];
  return {
    id: `p${i + 1}`,
    authorId: author.id,
    title: `Post number ${i + 1}`,
    body:
      i % 7 === 0
        ? `Check out my site <img src=x onerror="alert('xss-${i}')"> thanks for reading!`
        : `This is the body text of post ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    createdAt: Date.now() - i * 1000 * 60 * 5,
    bookmarkedBy: [],
  };
});

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function findUserByUsername(username: string): User | undefined {
  return users.find((u) => u.username === username);
}

export { weakHash };
