import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const puzzles = join(root, "puzzles");

const installed = join(homedir(), ".bend/bin/bend");
const bend = spawnSync("bend", ["version"]).status === 0 ? "bend" : existsSync(installed) ? installed : null;
if (!bend) {
  console.error("bend not found: curl -fsSL https://bend-lang.com/install.sh | sh");
  process.exit(1);
}

function run(cwd, args) {
  const { status } = spawnSync(bend, args, { cwd, stdio: "inherit" });
  if (status !== 0) process.exit(status ?? 1);
}

const games = readdirSync(puzzles, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(puzzles, d.name, "PROOF.bend")))
  .map((d) => d.name);

for (const game of games) {
  const dir = join(puzzles, game);
  console.log(`${game}:`);
  run(dir, ["PROOF.bend"]);
  run(dir, ["gen.bend", "-o", join(root, "lib", game, "gen.mjs")]);
}
