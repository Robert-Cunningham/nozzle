import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const temporary = mkdtempSync(join(tmpdir(), "nozzle-package-"))
const npm = process.platform === "win32" ? "npm.cmd" : "npm"
const env = { ...process.env, npm_config_cache: join(temporary, "npm-cache") }

function run(command, args, cwd = temporary) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
  if (result.error) throw result.error
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "")
    process.stderr.write(result.stderr ?? "")
    throw new Error(`${command} exited with status ${result.status}`)
  }
  return result.stdout
}

try {
  const [packed] = JSON.parse(run(npm, ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary], root))
  const files = packed.files.map((file) => file.path)
  for (const required of [
    "dist/index.js",
    "dist/index.mjs",
    "dist/index.d.ts",
    "dist/index.d.mts",
    "LICENSE",
    "README.md",
  ]) {
    assert(files.includes(required), `Package is missing ${required}`)
  }
  assert(!files.some((path) => /^(src|test|scripts|node_modules)\//.test(path)), "Package contains development files")
  writeFileSync(join(temporary, "package.json"), JSON.stringify({ name: "nozzle-consumer-check", private: true }))
  run(npm, [
    "install",
    "--offline",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--package-lock=false",
    join(temporary, packed.filename),
  ])

  const runtime = `
async function main() {
  assert.equal(Object.hasOwn(RegExp.prototype, "toPartialMatchRegex"), false)
  const result = await nz(["one:", ":two"]).split("::").consume()
  assert.deepEqual(result.list(), ["one", "two"])
  function* source() { yield "a"; return 42 }
  assert.equal((await nz(source()).map(x => x.toUpperCase()).consume()).return(), 42)
  assert.deepEqual((await nz(["hi"]).flatMap(x => x.split("")).consume()).list(), ["h", "i"])
}
main().catch(error => { console.error(error); process.exitCode = 1 })
`
  for (const [extension, imports] of [
    ["mjs", 'import assert from "node:assert/strict"; import { nz } from "nozzle-js";'],
    ["cjs", 'const assert = require("node:assert/strict"); const { nz } = require("nozzle-js");'],
  ]) {
    const filename = `consumer.${extension}`
    writeFileSync(join(temporary, filename), imports + runtime)
    run(process.execPath, [filename])
  }

  const types = `
import { nz, type Pipeline } from "nozzle-js"
async function* source(): AsyncGenerator<string, number> { yield "a"; return 42 }
const pipeline: Pipeline<string, number> = nz(source()).split(",").wrap().unwrap()
const iter: AsyncIterator<string, number> = pipeline[Symbol.asyncIterator]()
const chars: Pipeline<string, undefined> = nz(["hi"]).flatMap(s => s.split(""))
function* sync(): Generator<string, { count: number }> { yield "a"; return { count: 1 } }
const syncPipeline: Pipeline<string, { count: number }> = nz(sync())
// @ts-expect-error Return types must not silently become any.
const wrong: Pipeline<string, boolean> = nz(source())
void [iter, chars, syncPipeline, wrong]
`
  for (const extension of ["mts", "cts"]) {
    writeFileSync(join(temporary, `consumer.${extension}`), types)
  }
  run(process.execPath, [
    join(root, "node_modules/typescript/bin/tsc"),
    "--noEmit",
    "--strict",
    "--target",
    "ES2022",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "consumer.mts",
    "consumer.cts",
  ])
  const installed = JSON.parse(readFileSync(join(temporary, "node_modules/nozzle-js/package.json"), "utf8"))
  assert.equal(installed.version, JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version)
  console.log(`Packed ${installed.name}@${installed.version}: ESM, CommonJS, and TypeScript consumers passed`)
} catch (error) {
  process.stderr.write(error.stdout?.toString() ?? "")
  process.stderr.write(error.stderr?.toString() ?? "")
  throw error
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
