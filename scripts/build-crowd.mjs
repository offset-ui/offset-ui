import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { svgPathBbox } from "svg-path-bbox";
import svgpath from "svgpath";

const bustDir = process.argv[2];
if (!bustDir) {
  console.error('Usage: npm run crowd -- "<Open Peeps>/Flat Assets/Templates/Bust"');
  process.exit(1);
}
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const OFFSET = { body: [31.1, 135.1], head: [78.6, 38], face: [112.2, 77.4], "facial-hair": [104.6, 109.5], accessories: [88.5, 89] };
const LAYER_ID = /<g id="((?:body|head|face|facial-hair|accessories)\/[^"]*)" transform="translate\([^)]*\)"/g;

function balancedGroup(source, start) {
  const tag = /<(\/?)g\b[^>]*?(\/?)>/g;
  tag.lastIndex = start;
  let depth = 0;
  for (let match; (match = tag.exec(source)); ) {
    if (match[2] === "/") continue;
    depth += match[1] ? -1 : 1;
    if (depth === 0) return source.slice(start, tag.lastIndex);
  }
}

const atoms = {};
for (const file of readdirSync(bustDir).filter((name) => name.endsWith(".svg"))) {
  const source = readFileSync(path.join(bustDir, file), "utf8");
  for (const match of source.matchAll(LAYER_ID)) {
    if (atoms[match[1]]) continue;
    const group = balancedGroup(source, match.index);
    if (group) atoms[match[1]] = group.replace(/ transform="translate\([^)]*\)"/, "");
  }
}

const run = (svg) => optimize(svg, { floatPrecision: 1, plugins: ["preset-default"] }).data;
const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 324">${inner}</svg>`;
const layer = (type, name) => {
  if (!name) return "";
  if (!atoms[`${type}/${name}`]) throw new Error(`Missing ${type}/${name} in the Open Peeps pack`);
  return `<g transform="translate(${OFFSET[type].join(" ")})">${atoms[`${type}/${name}`]}</g>`;
};
const WHITE = new Set(["#fff", "#ffffff"]);
const inkOf = (attrs) => (WHITE.has(/fill="(#[0-9a-fA-F]+)"/.exec(attrs)?.[1]?.toLowerCase()) ? 0 : 1);
const pathsOf = (svg) => [...svg.matchAll(/<path ([^>]*?)\/?>/g)].map((match) => [inkOf(match[1]), /\sd="([^"]+)"/.exec(` ${match[1]}`)[1]]);
const pathSvg = (list) => list.map(([ink, d]) => `<path fill="${ink ? "#000" : "#fff"}" d="${d}"/>`).join("");

const ellipse = (cx, cy, rx, ry, fill) => `<path fill="${fill}" d="M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z"/>`;
const roundRect = (x, y, w, h, r, fill) =>
  `<path fill="${fill}" d="M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z"/>`;
const band = (rx, ry, thickness, fill) => {
  const [ox, oy, ix, iy] = [rx + thickness / 2, ry + thickness / 2, rx - thickness / 2, ry - thickness / 2];
  return `<path fill="${fill}" d="M${127 - ox} 106A${ox} ${oy} 0 0 1 ${127 + ox} 106L${127 + ix} 106A${ix} ${iy} 0 0 0 ${127 - ix} 106Z"/>`;
};
const cup = (cx) => ellipse(cx, 109, 9.6, 13, "#fff") + ellipse(cx, 109, 7.4, 10.8, "#111") + ellipse(cx - 2, 105.5, 1.3, 3.2, "#fff");
const finger = (cx, cy) => ellipse(cx, cy, 7.6, 4.3, "#111") + ellipse(cx, cy, 5.6, 2.5, "#fff");
const HEADPHONES = band(45, 53, 6.2, "#fff") + band(45, 53, 2.8, "#111") + cup(82) + cup(172);
const PHONE_UP =
  `<g transform="rotate(8 205 126)">${roundRect(190, 100, 30, 48, 7, "#fff")}${roundRect(192, 102, 26, 44, 5.5, "#111")}${roundRect(194.6, 106, 20.8, 34, 2.5, "#fff")}` +
  `${roundRect(198, 131, 3, 5, 0.6, "#111")}${roundRect(202.4, 128, 3, 8, 0.6, "#111")}${roundRect(206.8, 125, 3, 11, 0.6, "#111")}${roundRect(211.2, 122, 3, 14, 0.6, "#111")}` +
  `${finger(193, 138)}${finger(192.5, 145)}${finger(193.5, 152)}${ellipse(218, 146, 3.8, 7.4, "#111")}${ellipse(218, 146, 2, 5.4, "#fff")}</g>`;

function faceParts(faceName, blink) {
  const rest = [];
  const eyes = [[], []];
  for (const [ink, d] of pathsOf(run(wrap(layer("face", faceName))))) {
    for (const piece of svgpath(d).abs().round(1).toString().split(/(?=M)/).filter(Boolean)) {
      const [x0, y0, x1, y1] = svgPathBbox(piece);
      const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
      if (blink && cy >= 98 && cy < 107) eyes[cx < 147 ? 0 : 1].push([ink, piece]);
      else rest.push([ink, piece]);
    }
  }
  return { rest, eyes };
}

function buildPeep(spec) {
  const tilt = spec.tilt ? ` transform="rotate(${spec.tilt} 120 160)"` : "";
  const gaze = spec.gaze ? ` transform="translate(${spec.gaze.join(" ")})"` : "";
  const { rest, eyes } = faceParts(spec.face, !spec.glasses?.startsWith("Sunglasses"));
  const head = `${layer("head", spec.head)}${spec.headphones ? HEADPHONES : ""}${pathSvg(rest)}${layer("facial-hair", spec.facial)}${layer("accessories", spec.glasses)}`;
  return {
    paths: pathsOf(run(wrap(`${layer("body", spec.body)}${spec.phoneUp ? PHONE_UP : ""}<g${tilt}>${head}</g>`))),
    eyes: eyes.filter((group) => group.length).map((group) => pathsOf(run(wrap(`<g${tilt}><g${gaze}>${pathSvg(group)}</g></g>`)))),
  };
}

let seed = 33;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (list) => list[Math.floor(random() * list.length)];

const HEADS = {
  m: ["Short-5", "Short-3", "Flat-Top", "Flat-Top-Long", "Pomp", "Shaved-2", "Shaved-3", "hat-beanie", "Cornrows", "Afro", "Gray-Short", "Twists-2", "Medium-3", "No-Hair-1"],
  w: ["Long", "Long-Curly", "Long-Afro", "Long-Bangs", "Bun", "Bun-2", "Buns", "Bantu-Knots", "Medium-2", "Medium-Bangs", "Medium-Bangs-2", "Medium-Bangs-3", "Hijab", "Twists", "Cornrows-2", "Medium-1", "Medium-Straight"],
};
const PHONE_HEADS = {
  m: ["Short-5", "Short-3", "Flat-Top", "Pomp", "Shaved-2", "Shaved-3", "Cornrows", "Afro", "Twists-2"],
  w: ["Long", "Long-Curly", "Long-Bangs", "Bun-2", "Buns", "Medium-Bangs", "Medium-Bangs-2", "Twists", "Hijab", "Medium-Straight"],
};
const HEADPHONE_HEADS = { m: ["Short-5", "Short-3", "Flat-Top", "Pomp", "Shaved-2", "Shaved-3", "No-Hair-1"], w: ["Short-3", "Medium-2", "Medium-1"] };
const BEARDS = ["Full", "Full-2", "Full-3", "Chin"];
const GLASSES = ["Glasses", "Glasses-2", "Glasses-3", "Glasses-4", "Glasses-5"];
const LOOK_UP = [0.8, -4.5];
const LOOK_AT_PHONE = [1.8, -4];

const PLAN = [["laptop", 8], ["phone", 7], ["gamer", 3], ["hoodie", 6], ["hp", 8], ["sun", 5], ["up", 5], ["signal", 4], ["geek", 2]];
const BODIES = {
  laptop: () => ({ body: "Macbook" }),
  phone: () => ({ body: "Device" }),
  gamer: () => ({ body: "Gaming" }),
  hoodie: () => ({ body: "Hoodie" }),
  geek: () => ({ body: pick(["Thunder-T-Shirt", "Tee-1"]), glasses: pick(GLASSES) }),
  hp: (gender) => ({ body: pick(gender === "w" ? ["Device", "Gaming", "Hoodie", "Tee-Selena"] : ["Device", "Gaming", "Hoodie", "Tee-1"]), headphones: true }),
  sun: () => ({ body: pick(["Hoodie", "Device", "Gaming", "Thunder-T-Shirt", "Macbook"]), glasses: pick(["Sunglasses", "Sunglasses-2"]) }),
  up: () => ({ body: pick(["Pointing-Up", "Hoodie", "Tee-1"]), tilt: -(12 + Math.floor(random() * 3)), gaze: LOOK_UP }),
  signal: () => ({ body: "Pointing-Up", phoneUp: true, tilt: 6, gaze: LOOK_AT_PHONE }),
};
const headsFor = (kind, gender) => (kind === "hp" ? HEADPHONE_HEADS : kind === "phone" || kind === "signal" ? PHONE_HEADS : HEADS)[gender];

const usedHeads = new Set();
const cast = {};
for (const [kind, count] of PLAN) {
  for (let i = 0; i < count; i++) {
    const gender = kind === "sun" ? (i === 4 ? "w" : "m") : i % 2 === 0 || kind === "geek" ? "m" : "w";
    const pool = headsFor(kind, gender).filter((head) => !usedHeads.has(head));
    const head = pick(pool.length ? pool : headsFor(kind, gender));
    usedHeads.add(head);
    const spec = { head, face: pick(["Smiling", "Smiling", "Calm", gender === "w" ? "Cute" : "Smiling", kind === "laptop" ? "Driven" : "Calm"]) };
    if (kind !== "sun" && random() < 0.72 && !(kind === "hp" && random() < 0.4)) spec.glasses = pick(GLASSES);
    if (gender === "m" && random() < 0.62 && head !== "No-Hair-1") spec.facial = pick(BEARDS);
    cast[`${kind}-${gender}${i}`] = { ...spec, ...BODIES[kind](gender) };
  }
}

const WIDTH = 1440;
const HEIGHT = 290;
const HEAD_BOX = [68, 36, 172, 140];
const Y_RANGE = [2, 124];
const scaleAt = (y) => 0.5 + (0.34 * (y - Y_RANGE[0])) / (Y_RANGE[1] - Y_RANGE[0]);
const headBox = (p) => HEAD_BOX.map((value, i) => (i % 2 ? p.y : p.x) + value * p.s);
const overlap = (a, b) => {
  const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  const h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  return w <= 0 || h <= 0 ? 0 : (w * h) / Math.min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]));
};

const placed = [];
for (let attempt = 0; attempt < 60000; attempt++) {
  const y = Y_RANGE[0] + random() * (Y_RANGE[1] - Y_RANGE[0]);
  const s = scaleAt(y) * (0.96 + random() * 0.08);
  const x = -HEAD_BOX[0] * s + random() * (WIDTH + (HEAD_BOX[0] - HEAD_BOX[2]) * s + 40);
  const box = headBox({ x, y, s });
  if (placed.every((other) => overlap(box, headBox(other)) < 0.2)) placed.push({ x, y, s });
}
placed.sort((a, b) => a.y - b.y);

const names = Object.keys(cast);
const bag = [];
const nextName = () => {
  if (!bag.length) bag.push(...names.sort(() => random() - 0.5));
  return bag.pop();
};
let previous = "";
const people = placed.map((p) => {
  let id = nextName();
  if (id === previous) id = nextName();
  previous = id;
  return { id, x: Math.round(p.x), y: Math.round(p.y), s: +p.s.toFixed(3), r: +((random() - 0.5) * 5).toFixed(1), flip: random() < 0.5 ? 1 : 0 };
});

const SAY = {
  hp: ["Shh… I am in the zone 🎧", "This spring curve? Chef's kiss."],
  signal: ["Found signal! 📶", "One bar… two bars… got it!"],
  laptop: ["Hey! These components look good 👀", "Shipping this on Friday 🚀"],
  sun: ["Too cool for hand-rolled CSS.", "Offset-grade. I said what I said."],
  up: ["That headline though ☝️", "Wait, is that a hand dragging the toggle?"],
  hoodie: ["One file. Copy, paste, done.", "Who drew that pen-strike checklist?"],
  phone: ["Copy for AI? Genius.", "Ctrl + K is my favorite shortcut."],
  gamer: ["MIT licensed. Take it all.", "Star it on GitHub ⭐"],
  geek: ["Made by a designer. You can tell."],
};
const talkers = [];
const lines = Object.fromEntries(Object.entries(SAY).map(([kind, list]) => [kind, [...list]]));
for (let round = 0; round < 2; round++) {
  for (const kind of Object.keys(SAY)) {
    const text = lines[kind].shift();
    const candidates = people.filter((p) => p.id.split("-")[0] === kind && !p.say && talkers.every((t) => Math.abs(t.x - p.x) > 95));
    if (!text || !candidates.length) continue;
    const talker = pick(candidates);
    talker.say = text;
    talkers.push(talker);
  }
}

const peeps = Object.fromEntries([...new Set(people.map((p) => p.id))].map((id) => [id, buildPeep(cast[id])]));
const EYE_STYLE = "transform:scaleY(var(--blink,1));transform-box:fill-box;transform-origin:center;transition:transform 70ms ease-out";
const pathTag = ([ink, d]) => `<path d="${d}" fill="${ink ? "#111" : "#fff"}" fill-rule="evenodd"/>`;
const sprite = `<svg xmlns="http://www.w3.org/2000/svg">${Object.entries(peeps)
  .map(([id, p]) => `<symbol id="peep-${id}" viewBox="0 0 240 324">${p.paths.map(pathTag).join("")}${p.eyes.map((eye) => `<g style="${EYE_STYLE}">${eye.map(pathTag).join("")}</g>`).join("")}</symbol>`)
  .join("")}</svg>`;

mkdirSync(path.join(root, "public"), { recursive: true });
writeFileSync(path.join(root, "public/crowd.svg"), sprite);
writeFileSync(
  path.join(root, "lib/crowd.ts"),
  `type CrowdPerson = { id: string; x: number; y: number; s: number; r: number; flip: 0 | 1; say?: string };\n` +
    `export const CROWD: { width: number; height: number; peepWidth: number; peepHeight: number; people: CrowdPerson[] } = ${JSON.stringify({ width: WIDTH, height: HEIGHT, peepWidth: 240, peepHeight: 324, people })};\n`,
);
console.log(`${people.length} people, ${Object.keys(peeps).length} characters, ${talkers.length} talkers, sprite ${Math.round(sprite.length / 1024)}KB`);
