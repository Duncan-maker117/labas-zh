import { describe, expect, it } from "bun:test";
import { getLoginDestination } from "../login-destination";

describe("login destination", () => {
  it("returns the requested administration page after login", () => {
    expect(getLoginDestination("/admin/settings")).toBe("/admin/settings");
    expect(getLoginDestination("/admin/users")).toBe("/admin/users");
    expect(getLoginDestination("/admin/")).toBe("/admin");
  });
  it("uses the learning dashboard when no destination was requested", () => {
    expect(getLoginDestination(undefined)).toBe("/dashboard");
  });
  it("rejects external, malformed, and unknown destinations", () => {
    for (const destination of ["https://example.com", "//example.com", "/\\example.com", "/admin/unknown", "/login", ["/admin"], null]) {
      expect(getLoginDestination(destination)).toBe("/dashboard");
    }
  });
});
