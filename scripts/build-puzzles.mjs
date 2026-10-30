import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const project = join(root, "puzzles/ice-slide");

const installed = join(homedir(), ".bend/bin/bend");
const bend = spawnSync("bend", ["version"]).status === 0 ? "bend" : existsSync(installed) ? installed : null;
if (!bend) {
  console.error("bend not found: curl -fsSL https://bend-lang.com/install.sh | sh");
  process.exit(1);
}

function run(args) {
  const { status } = spawnSync(bend, args, { cwd: project, stdio: "inherit" });
  if (status !== 0) process.exit(status ?? 1);
}

run(["PROOF.bend"]);
run(["gen.bend", "-o", join(root, "lib/ice-slide/gen.mjs")]);
