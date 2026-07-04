import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import userRoutes from "./routes/users";
import { cacheStats } from "./utils/cache";

const app = express();
const PORT = process.env.PORT || 4000;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / non-browser requests (origin undefined) and the explicit allowlist.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
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
app.get("/trending", (req, res, next) => {
  fetchTrendingTopics().then((topics) => {
    res.json({ topics });
  }).catch(next);
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
