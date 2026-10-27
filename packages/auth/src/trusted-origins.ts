import { networkInterfaces } from "node:os";

export function getTrustedOrigins(
  configuredOrigin: string,
  nodeEnv: string,
  interfaces = networkInterfaces(),
) {
  if (nodeEnv !== "development") return [configuredOrigin];

  const site = new URL(configuredOrigin);
  const hosts = ["localhost", "127.0.0.1"];
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4") hosts.push(address.address);
    }
  }

  // Only trust this computer's actual addresses on the configured web port.
  return [...new Set([configuredOrigin, ...hosts.map((host) => {
    const origin = new URL(site.origin);
    origin.hostname = host;
    return origin.origin;
  })])];
}
