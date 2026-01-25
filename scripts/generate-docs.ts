/**
 * Documentation generator using TypeDoc's programmatic API.
 *
 * Usage: npx tsx scripts/generate-docs.ts
 * Output: README.md
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

/** Group ordering (descriptions come from @groupDescription in source) */
const GROUP_ORDER: Record<string, number> = {
  Elements: 1,
  Indexing: 2,
  Filtering: 3,
  Splitting: 4,
  Accumulation: 5,
  Transformation: 6,
  Regex: 7,
  Timing: 8,
  Buffering: 9,
  "Side Effects": 10,
  "Error Handling": 11,
  "Return Values": 12,
  Conversion: 13,
  Functions: 14,
  Other: 99,
}

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

  // Collect @groupDescription tags from all declarations
  const groupDescriptions = collectGroupDescriptions(project.children ?? [])

  // Group functions by their @group tag
  const grouped = groupByTag(functions)

  // Sort groups by order, then render each group
  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    const orderA = GROUP_ORDER[a[0]] ?? 99
    const orderB = GROUP_ORDER[b[0]] ?? 99
    return orderA - orderB
  })

  const docs = sortedGroups
    .map(([groupName, funcs]) => {
      // Sort functions within group alphabetically
      funcs.sort((a, b) => a.name.localeCompare(b.name))

      const groupHeader = `# ${groupName}`
      const groupDesc = groupDescriptions[groupName]
      const descSection = groupDesc ? `\n\n${groupDesc}` : ""
      const funcDocs = funcs.map(renderFunction).join("\n\n---\n\n")

      return `${groupHeader}${descSection}\n\n${funcDocs}`
    })
    .join("\n\n---\n\n")

  // Combine with preamble
  const preamble = fs.readFileSync("Preamble.md", "utf-8")
  fs.writeFileSync("README.md", `${preamble}\n${docs}\n`)

  console.log(`Generated docs for ${functions.length} functions in ${sortedGroups.length} groups`)
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
 * Collect @groupDescription tags from all declarations in the project
 */
function collectGroupDescriptions(children: DeclarationReflection[]): Record<string, string> {
  const descriptions: Record<string, string> = {}

  function processComment(comment: Comment | undefined) {
    if (!comment?.blockTags) return
    for (const tag of comment.blockTags) {
      if (tag.tag === "@groupDescription") {
        // First word is the group name, rest is description
        const content = Comment.combineDisplayParts(tag.content).trim()
        const firstSpace = content.indexOf("\n")
        if (firstSpace > 0) {
          const groupName = content.slice(0, firstSpace).trim()
          const description = content.slice(firstSpace + 1).trim()
          descriptions[groupName] = description
        }
      }
    }
  }

  function recurse(children: DeclarationReflection[]) {
    for (const child of children) {
      // Check the declaration's own comment
      processComment(child.comment)

      // Check signature comments
      if (child.signatures) {
        for (const sig of child.signatures) {
          processComment(sig.comment)
        }
      }

      // Recurse into children
      if (child.children?.length) {
        recurse(child.children)
      }
    }
  }

  recurse(children)
  return descriptions
}

/**
 * Group functions by their @group tag
 */
function groupByTag(functions: DeclarationReflection[]): Record<string, DeclarationReflection[]> {
  const groups: Record<string, DeclarationReflection[]> = {}

  for (const func of functions) {
    const groupName = getGroup(func)
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(func)
  }

  return groups
}

/**
 * Get the @group tag value from a declaration
 */
function getGroup(r: DeclarationReflection): string {
  const comment = getComment(r)
  const groupTag = comment?.blockTags?.find((t) => t.tag === "@group")
  if (groupTag) {
    return Comment.combineDisplayParts(groupTag.content).trim()
  }
  return "Other"
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

  // Heading (## since groups are #)
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
