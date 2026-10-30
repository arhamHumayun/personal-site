import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const project = join(root, "puzzles/ice-slide");
const build = join(project, ".build");
const config = JSON.parse(readFileSync(join(project, "config.json"), "utf8"));

const { values } = parseArgs({
  options: {
    start: { type: "string", default: config.epoch },
    days: { type: "string", default: String(config.days) },
    seed: { type: "string", default: String(config.seed) },
    min: { type: "string", default: String(config.min) },
    max: { type: "string", default: String(config.max) },
  },
});

const installed = join(homedir(), ".bend/bin/bend");
const bend = spawnSync("bend", ["version"]).status === 0 ? "bend" : existsSync(installed) ? installed : null;
if (!bend) {
  console.error("bend not found: curl -fsSL https://bend-lang.com/install.sh | sh");
  process.exit(1);
}

function run(cmd, args) {
  const { status } = spawnSync(cmd, args, { cwd: project, stdio: "inherit" });
  if (status !== 0) process.exit(status ?? 1);
}

mkdirSync(build, { recursive: true });
mkdirSync(join(root, "public/data"), { recursive: true });

run(bend, ["PROOF.bend"]);
run(bend, ["gen.bend", "-o", join(build, "gen")]);
run(join(build, "gen"), [
  values.start,
  values.days,
  values.seed,
  values.min,
  values.max,
  join(root, "public/data/ice-slide.json"),
  join(project, "solutions.json"),
]);
