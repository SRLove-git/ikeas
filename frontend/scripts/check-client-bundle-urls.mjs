import { readdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"

const root = resolve(process.cwd(), ".next/static")
const forbidden = /(?:https?|wss?):\/\/(?:localhost|127(?:\.\d{1,3}){3})(?::\d+)?/gi
const failures = []

async function inspect(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name)
    if (entry.isDirectory()) {
      await inspect(child)
      continue
    }
    if (!/\.(?:css|html|js|json|map|txt)$/i.test(entry.name)) continue
    const content = await readFile(child, "utf8")
    const matches = [...content.matchAll(forbidden)].map(match => match[0])
    if (matches.length) failures.push({ path: child, matches: [...new Set(matches)] })
  }
}

await inspect(root)
if (failures.length) {
  console.error("Client bundle contains local development API addresses:")
  for (const failure of failures) {
    console.error(`- ${failure.path}: ${failure.matches.join(", ")}`)
  }
  process.exit(1)
}
console.log(`Client bundle URL check passed: ${root}`)
