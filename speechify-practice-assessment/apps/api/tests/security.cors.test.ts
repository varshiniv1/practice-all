import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/index";

// Regression test for: CORS reflects any origin with credentials.
// origin:true + credentials:true lets any malicious site make authenticated
// cross-origin requests using the victim's tokens.
//
// A safe CORS config must either (a) restrict allowed origins to an explicit
// allowlist, or (b) refuse to echo back arbitrary origins when credentials
// are enabled.
describe("security: CORS origin reflection with credentials (finding #4)", () => {
  it("does not reflect an untrusted origin in Access-Control-Allow-Origin when credentials are enabled", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://evil.com");

    const acao = res.headers["access-control-allow-origin"];
    const acac = res.headers["access-control-allow-credentials"];

    // If both headers are present simultaneously the server is vulnerable:
    // any origin can make credentialed requests.
    const isVulnerable =
      acao === "https://evil.com" && acac === "true";

    expect(isVulnerable).toBe(false);
  });

  it("does not echo back an arbitrary Origin header as the allowed origin", async () => {
    const maliciousOrigin = "https://attacker.example.com";

    const res = await request(app)
      .get("/health")
      .set("Origin", maliciousOrigin);

    const acao = res.headers["access-control-allow-origin"];

    // origin:true causes cors() to echo whatever Origin the client sent.
    // The safe expectation is that a random external origin is NOT reflected.
    expect(acao).not.toBe(maliciousOrigin);
  });
});
