export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  bio: string;
  isAdmin: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: number;
  bookmarkedBy: string[];
}

export interface PublicUser {
  id: string;
  username: string;
  bio: string;
}

export interface AuthTokenPayload {
  sub: string;
  username: string;
  isAdmin: boolean;
}
