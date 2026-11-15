import { generateExtractDemo } from "./demo-extract.js"
import { generateParseDemo } from "./demo-parse.js"
import { generateTimingDemo } from "./demo-timing.js"

async function main() {
  await generateParseDemo()
  await generateExtractDemo()
  await generateTimingDemo()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
