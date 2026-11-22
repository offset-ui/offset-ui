import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const base = process.argv[2] ?? "http://localhost:3000";
const SIZE = { width: 704, height: 440 };
const DEVICE_SCALE = 2;
const WINDOW = "900,800";
const BROWSERS = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];

const CAPTURE_TIMEOUT_MS = 60000;
const POLL_MS = 250;

const browser = BROWSERS.find((candidate) => candidate && existsSync(candidate));
if (!browser) throw new Error("Chrome or Edge not found. Set the CHROME environment variable to its path.");

const root = path.join(import.meta.dirname, "..");
const out = path.join(root, "public/thumbnails");
mkdirSync(out, { recursive: true });

for (const file of readdirSync(path.join(root, "components/ui")).filter((name) => name.endsWith(".tsx"))) {
  const slug = file.replace(".tsx", "");
  const shot = path.join(tmpdir(), `${slug}.png`);
  rmSync(shot, { force: true });
  execFileSync(browser, ["--headless=new", `--user-data-dir=${path.join(tmpdir(), `offset-thumbnails-${slug}`)}`, "--hide-scrollbars", `--force-device-scale-factor=${DEVICE_SCALE}`, `--window-size=${WINDOW}`, "--virtual-time-budget=12000", `--screenshot=${shot}`, `${base}/thumbnail/${slug}`], { stdio: "ignore" });
  for (let waited = 0; !existsSync(shot); waited += POLL_MS) {
    if (waited > CAPTURE_TIMEOUT_MS) throw new Error(`No screenshot for ${slug}`);
    await sleep(POLL_MS);
  }
  await sleep(POLL_MS);
  await sharp(shot)
    .extract({ left: 0, top: 0, width: SIZE.width * DEVICE_SCALE, height: SIZE.height * DEVICE_SCALE })
    .webp({ quality: 82 }).toFile(path.join(out, `${slug}.webp`));
  console.log(slug);
}
