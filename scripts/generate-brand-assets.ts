/** Adapt the transparent DUNCAN cutout to browser, PWA and sharing surfaces. */
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const publicDir = join(root, "apps/web/public");
const requireWeb = createRequire(join(root, "apps/web/package.json"));
const sharp: typeof import("../apps/web/node_modules/sharp") = requireWeb("sharp");
const source = await readFile(join(root, "02_品牌素材/DUNCAN_透明标志.png"));
const image = `data:image/png;base64,${source.toString("base64")}`;
const svg = (width: number, height: number, body: string) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
);

// ViewBox crops only the original D mark, with padding; the artwork is not redrawn.
const mark = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="100 -50 1000 1000"><image href="${image}" width="2736" height="912"/></svg>`);
await writeFile(join(publicDir, "duncan-logo-transparent.png"), source);
await writeFile(join(publicDir, "duncan-logo.png"), source);
await writeFile(join(publicDir, "duncan-mark.svg"), mark);
await sharp(mark).png().toFile(join(publicDir, "duncan-icon-transparent.png"));
await sharp(mark).png().toFile(join(publicDir, "duncan-icon.png"));
// Existing public URLs continue to resolve to the new identity.
await sharp(mark).png().toFile(join(publicDir, "labas_icon.png"));
for (const width of [100, 200, 400]) {
  await sharp(source).resize({ width }).webp({ quality: 95 }).toFile(join(publicDir, `logo-${width}.webp`));
}

const hero = svg(1536, 1024, `<image href="${image}" x="80" y="250" width="1376" height="459"/>`);
const notFound = svg(1200, 762, `<image href="${image}" x="120" y="60" width="960" height="320"/><text x="600" y="638" text-anchor="middle" font-family="Arial,sans-serif" font-size="240" font-weight="800" fill="#14095b">404</text><path d="M390 696h420" stroke="#00c9e5" stroke-width="16" stroke-linecap="round"/>`);
for (const width of [400, 800, 1200, 1800]) {
  await sharp(hero).resize({ width }).webp({ quality: 90 }).toFile(join(publicDir, `hero_img-${width}.webp`));
  await sharp(hero).resize({ width }).webp({ quality: 90 }).toFile(join(publicDir, `duncan-hero-${width}.webp`));
}
for (const width of [400, 800]) {
  await sharp(notFound).resize({ width }).webp({ quality: 90 }).toFile(join(publicDir, `not_found-${width}.webp`));
  await sharp(notFound).resize({ width }).webp({ quality: 90 }).toFile(join(publicDir, `duncan-not-found-${width}.webp`));
}

const social = svg(1200, 630, `<rect width="1200" height="630" fill="#faf9f7"/><image href="${image}" x="100" y="148" width="1000" height="334"/>`);
for (const filename of ["og_image.png", "opengraph-image.png"]) {
  await sharp(social).png({ palette: false, compressionLevel: 9 }).toFile(join(publicDir, filename));
}
await sharp(social).jpeg({ quality: 90, mozjpeg: true }).toFile(join(publicDir, "twitter-image.jpg"));
console.log("Transparent DUNCAN assets rebuilt; original white-background artwork preserved in the brand folder.");
