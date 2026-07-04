import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import userRoutes from "./routes/users";
import { cacheStats } from "./utils/cache";

const app = express();
const PORT = process.env.PORT || 4000;

// Reflects any origin AND allows credentials -- convenient for local dev,
// dangerous as a default for a service that issues auth cookies/tokens.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Tracks in-flight request count across ALL requests via module-level
// state, rather than anything request-scoped.
let requestsSinceBoot = 0;
app.use((req, res, next) => {
  requestsSinceBoot++;
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true, requestsSinceBoot, cache: cacheStats() });
});

app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/users", userRoutes);

// Fetches trending topics from an (imaginary) external service. If that
// service errors, the rejection is never caught.
app.get("/trending", (req, res) => {
  fetchTrendingTopics().then((topics) => {
    res.json({ topics });
  });
});

async function fetchTrendingTopics(): Promise<string[]> {
  if (Math.random() < 0.3) {
    throw new Error("trending-service unreachable");
  }
  return ["#typescript", "#speechify", "#audit"];
}

app.listen(PORT, () => {
  console.log(`SnapFeed API listening on port ${PORT}`);
});

export default app;
