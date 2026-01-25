/**
 * Simpler documentation generator using TypeDoc's programmatic API.
 * Alternative to the theme-based approach in typedoc-theme-example-first.mjs
 *
 * Usage: npx tsx scripts/generate-docs.ts
 * Output: README.modern.md
 */

import {
  Application,
  DeclarationReflection,
  Comment,
  SignatureReflection,
  ParameterReflection,
  TypeParameterReflection,
} from "typedoc"
import * as fs from "fs"

async function main() {
  // Use bootstrap (not bootstrapWithPlugins) to avoid loading plugins
  // Pass options: null to prevent reading typedoc.json
  const app = await Application.bootstrap(
    {
      entryPoints: ["src/index.ts"],
      tsconfig: "tsconfig.json",
      skipErrorChecking: true, // Skip TS errors in tests
    },
    [
      // Empty array means no config file readers
    ],
  )

  const project = await app.convert()
  if (!project) throw new Error("Failed to convert project")

  // Get all exported functions/declarations that have signatures
  const functions = collectFunctions(project.children ?? [])
  functions.sort((a, b) => a.name.localeCompare(b.name))

  // Render each function
  const docs = functions.map(renderFunction).join("\n\n---\n\n")

  // Combine with preamble
  const preamble = fs.readFileSync("Preamble.md", "utf-8")
  fs.writeFileSync("README.modern.md", `${preamble}\n${docs}\n`)

  console.log(`Generated docs for ${functions.length} functions`)
}

/**
 * Recursively collect all function-like declarations from the project
 */
function collectFunctions(children: DeclarationReflection[]): DeclarationReflection[] {
  const result: DeclarationReflection[] = []

  for (const child of children) {
    // Check if this is a function-like declaration
    const hasSignatures =
      child.signatures?.length ||
      (child.type && "declaration" in child.type && child.type.declaration?.signatures?.length)

    if (hasSignatures) {
      result.push(child)
    }

    // Recurse into modules/namespaces
    if (child.children?.length) {
      result.push(...collectFunctions(child.children))
    }
  }

  return result
}

/**
 * Get the primary signature for a declaration
 */
function getSignature(r: DeclarationReflection): SignatureReflection | undefined {
  if (r.signatures?.length) {
    return r.signatures[0]
  }
  if (r.type && "declaration" in r.type && r.type.declaration?.signatures?.length) {
    return r.type.declaration.signatures[0]
  }
  return undefined
}

/**
 * Get combined comment from signature and parent
 */
function getComment(r: DeclarationReflection): Comment | undefined {
  const sig = getSignature(r)
  return sig?.comment ?? r.comment
}

/**
 * Render a function declaration to markdown
 */
function renderFunction(r: DeclarationReflection): string {
  const sig = getSignature(r)
  const comment = getComment(r)

  // Extract parts from comment
  const examples =
    comment?.blockTags?.filter((t) => t.tag === "@example").map((t) => Comment.combineDisplayParts(t.content).trim()) ??
    []

  const description = comment?.summary ? Comment.combineDisplayParts(comment.summary).trim() : ""

  // Build output
  const parts: string[] = []

  // Heading
  parts.push(`## \`${r.name}\``)
  parts.push("")

  // Examples first (just the code, no heading)
  for (const ex of examples) {
    parts.push(ex)
    parts.push("")
  }

  // Description
  if (description) {
    parts.push(description)
    parts.push("")
  }

  // Details block
  const signature = buildSignature(r.name, sig)
  const paramsTable = buildParamsTable(sig?.parameters)

  parts.push("<details><summary>Details</summary>")
  parts.push("")
  parts.push("```ts")
  parts.push(signature)
  parts.push("```")
  parts.push("")

  if (paramsTable) {
    parts.push("### Parameters")
    parts.push("")
    parts.push(paramsTable)
  }

  parts.push("</details>")

  // Handle @see tags if present
  const seeTags = comment?.blockTags?.filter((t) => t.tag === "@see") ?? []
  if (seeTags.length) {
    parts.push("")
    parts.push("### See")
    parts.push("")
    for (const tag of seeTags) {
      parts.push(Comment.combineDisplayParts(tag.content).trim())
    }
  }

  return parts.join("\n")
}

/**
 * Build a function signature string
 */
function buildSignature(name: string, sig: SignatureReflection | undefined): string {
  if (!sig) return `function ${name}(): unknown;`

  const typeParams = buildTypeParams(sig.typeParameters)
  const params = buildParams(sig.parameters)
  const returnType = sig.type?.toString() ?? "void"

  return `function ${name}${typeParams}(${params}): ${returnType};`
}

/**
 * Build type parameters string like <T, U extends Foo>
 */
function buildTypeParams(typeParams: TypeParameterReflection[] | undefined): string {
  if (!typeParams?.length) return ""

  const parts = typeParams.map((tp) => {
    let result = tp.name
    if (tp.type) {
      result += ` extends ${tp.type.toString()}`
    }
    if (tp.default) {
      result += ` = ${tp.default.toString()}`
    }
    return result
  })

  return `<${parts.join(", ")}>`
}

/**
 * Build parameters string for signature
 */
function buildParams(params: ParameterReflection[] | undefined): string {
  if (!params?.length) return ""

  return params
    .map((p) => {
      const optional = p.flags.isOptional ? "?" : ""
      const type = p.type?.toString() ?? "unknown"
      return `${p.name}${optional}: ${type}`
    })
    .join(", ")
}

/**
 * Build parameters table for markdown
 */
function buildParamsTable(params: ParameterReflection[] | undefined): string {
  if (!params?.length) return ""

  const rows = params.map((p) => {
    const name = `\`${p.name}\``
    const type = escapeMarkdown(p.type?.toString() ?? "unknown")
    const desc = p.comment?.summary ? Comment.combineDisplayParts(p.comment.summary).trim() : "-"
    return `| ${name} | ${type} | ${desc} |`
  })

  return ["| Parameter | Type | Description |", "| ------ | ------ | ------ |", ...rows].join("\n")
}

/**
 * Escape special markdown characters in type strings
 */
function escapeMarkdown(str: string): string {
  return str.replace(/\|/g, "\\|").replace(/</g, "\\<").replace(/>/g, "\\>")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
