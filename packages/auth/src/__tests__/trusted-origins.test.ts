import { describe, expect, it } from "bun:test";
import type { NetworkInterfaceInfo } from "node:os";
import { getTrustedOrigins } from "../trusted-origins";

const lan: NetworkInterfaceInfo = {
  address: "192.168.1.4", family: "IPv4", internal: false,
  netmask: "255.255.255.0", mac: "00:00:00:00:00:00", cidr: "192.168.1.4/24",
};

describe("authentication trusted origins", () => {
  it("permits this computer's LAN address on the configured web port in development", () => {
    const origins = getTrustedOrigins("http://127.0.0.1:3001", "development", { WLAN: [lan] });
    expect(origins).toContain("http://192.168.1.4:3001");
    expect(origins).toContain("http://localhost:3001");
    expect(origins).not.toContain("http://192.168.1.5:3001");
    expect(origins).not.toContain("http://192.168.1.4:3000");
    expect(new Set(origins).size).toBe(origins.length);
  });

  it("keeps production restricted to the configured origin", () => {
    expect(getTrustedOrigins("https://example.com", "production", { WLAN: [lan] }))
      .toEqual(["https://example.com"]);
  });
});
