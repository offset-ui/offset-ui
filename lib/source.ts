import { readFileSync } from "node:fs";
import path from "node:path";

export const readSource = (file: string) => readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), file), "utf8");
