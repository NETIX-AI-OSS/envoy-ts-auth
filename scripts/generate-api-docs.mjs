import { execFileSync } from "node:child_process";

const gitRevision = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();

const args = [
  "--plugin",
  "typedoc-plugin-markdown",
  "--readme",
  "none",
  "--excludeInternal",
  "--excludePrivate",
  "--excludeProtected",
  "--out",
  "docs/api",
  "--basePath",
  ".",
  "--sourceLinkTemplate",
  "https://github.com/NETIX-AI-OSS/envoy-ts-auth/blob/{gitRevision}/{path}#L{line}",
  "--gitRevision",
  gitRevision,
  "src/index.ts",
];

execFileSync("./node_modules/.bin/typedoc", args, {
  stdio: "inherit",
});
