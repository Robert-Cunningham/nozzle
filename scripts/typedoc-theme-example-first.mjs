// A tiny custom TypeDoc theme for typedoc-plugin-markdown
// Renders function sections as: name → examples → description → params → returns
// Usage: add this file as a plugin and set theme to "example-first" in typedoc.json.

/*

Here's what you're trying to do:

### accumulate()

Yields a cumulative prefix of the input stream.

```ts
nz(["This ", "is ", "a ", "test!"]).accumulate() // => "This ", "This is ", "This is a ", "This is a test!"
```

<details><summary>Details</summary>

```ts
function accumulate(iterator: AsyncIterable<string>): AsyncGenerator<string>;
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

</details>

*/

import { ReflectionKind, translateTagName } from "typedoc"
import { MarkdownTheme, MarkdownThemeContext } from "typedoc-plugin-markdown"

class ExampleFirstContext extends MarkdownThemeContext {
  constructor(theme, page, options) {
    super(theme, page, options)

    const originalSignature = this.partials.signature.bind(this)

    // Override only the signature partial; keep everything else as-is
    this.partials.signature = (model, options = {}) => {
      const md = []

      // Helper to create markdown heading text
      const heading = (level, text) => `${"#".repeat(Math.max(1, level || 3))} ${text}`

      // 1) Skip extra name heading; container already renders the H3 title.

      // 2) Sources (if not disabled and not nested)
      if (!options.nested && model.sources && !this.options.getValue("disableSources")) {
        md.push(this.partials.sources(model))
      }

      // Build a comment object similar to the default implementation
      let modelComments = options.multipleSignatures ? model.comment : model.comment || model.parent?.comment

      if (modelComments && model.parent?.comment?.summary && !options.multipleSignatures) {
        modelComments = Object.assign({}, modelComments, {
          summary: model.parent.comment.summary,
        })
      }
      if (modelComments && model.parent?.comment?.blockTags) {
        modelComments = Object.assign({}, modelComments, {
          blockTags: [...(model.parent?.comment?.blockTags || []), ...(model.comment?.blockTags || [])],
        })
      }

      // 3) Examples first (just the @example tags)
      if (modelComments?.blockTags?.length) {
        const exampleTags = modelComments.blockTags.filter((t) => t.tag === "@example")
        if (exampleTags.length) {
          const examplesMd = exampleTags.map((tag) => this.helpers.getCommentParts(tag.content)).join("\n\n")
          md.push(examplesMd)
        }
      }

      // 4) Description (summary only, no tags)
      if (modelComments?.summary?.length) {
        md.push(this.helpers.getCommentParts(modelComments.summary))
      }

      // 5) Documents (remarks/links) from the parent
      if (!options.multipleSignatures && model.parent?.documents) {
        md.push(
          this.partials.documents(model.parent, {
            headingLevel: options.headingLevel,
          }),
        )
      }

      // 6) Type parameters: intentionally omitted from the main flow
      // to avoid interfering with downstream cleaners; add inside details if needed.

      // 7) Details block with signature and parameters
      {
        const details = []
        // Signature (code block)
        details.push(
          this.partials.signatureTitle(model, {
            accessor: options.accessor,
          }),
        )
        // Parameters table/list (if any)
        if (model.parameters?.length) {
          details.push(heading(options.headingLevel || 3, ReflectionKind.pluralString(ReflectionKind.Parameter)))
          if (this.helpers.useTableFormat("parameters")) {
            details.push(this.partials.parametersTable(model.parameters))
          } else {
            details.push(
              this.partials.parametersList(model.parameters, {
                headingLevel: options.headingLevel,
              }),
            )
          }
        }

        // Wrap details in a GitHub-compatible collapsible block
        // Ensure a blank line after <summary> for proper rendering of code fences inside
        md.push(`<details><summary>Details</summary>\n\n${details.filter(Boolean).join("\n\n")}\n\n</details>`)
      }

      // 8) Returns intentionally omitted to match final README expectations

      // 9) Remaining tags (excluding @example) and inheritance info
      if (modelComments) {
        // Render non-example tags by temporarily filtering out @example
        const remaining = Object.assign({}, modelComments, {
          blockTags: (modelComments.blockTags || []).filter((t) => t.tag !== "@example"),
        })
        md.push(
          this.partials.comment(remaining, {
            headingLevel: options.headingLevel,
            showTags: true,
            showSummary: false,
          }),
        )
      }

      md.push(this.partials.inheritance(model, { headingLevel: options.headingLevel }))

      return md.filter(Boolean).join("\n\n")
    }

    // Override declaration to ensure function-like variables/aliases follow the same structure
    const originalDeclaration = this.partials.declaration.bind(this)
    this.partials.declaration = (model, options = { headingLevel: 2, nested: false }) => {
      const md = []
      const opts = { nested: false, ...options }

      const heading = (level, text) => `${"#".repeat(Math.max(1, level || 3))} ${text}`

      // Title for the declaration (code block-style by default theme)
      md.push(this.partials.declarationTitle(model))

      // Sources
      if (!opts.nested && model.sources && !this.options.getValue("disableSources")) {
        md.push(this.partials.sources(model))
      }

      // Documents (remarks)
      if (model?.documents) {
        md.push(this.partials.documents(model, { headingLevel: opts.headingLevel }))
      }

      // Extract function-like signatures from declaration types
      const typeDecl = model.type?.declaration
      const signatures = typeDecl?.signatures || []

      // Merge comments from declaration and first signature (signature usually holds @example)
      const declComment = model.comment
      const sigComment = signatures[0]?.comment
      const mergedComment = (sigComment || declComment)
        ? {
            ...(sigComment || {}),
            summary: (sigComment?.summary?.length ? sigComment.summary : declComment?.summary) || [],
            blockTags: [
              ...((declComment && declComment.blockTags) || []),
              ...((sigComment && sigComment.blockTags) || []),
            ],
            modifierTags: new Set([...(declComment?.modifierTags || []), ...(sigComment?.modifierTags || [])]),
          }
        : undefined

      // Examples first
      if (mergedComment?.blockTags?.length) {
        const exampleTags = mergedComment.blockTags.filter((t) => t.tag === "@example")
        if (exampleTags.length) {
          md.push(exampleTags.map((t) => this.helpers.getCommentParts(t.content)).join("\n\n"))
        }
      }

      // Description next
      if (mergedComment?.summary?.length) {
        md.push(this.helpers.getCommentParts(mergedComment.summary))
      }

      // Details: include one or many signatures
      if (signatures.length) {
        const details = []
        if (signatures.length > 1) {
          signatures.forEach((sig, idx) => {
            details.push(heading(opts.headingLevel, `Call signature ${idx + 1}`))
            details.push(
              this.partials.signature(sig, {
                headingLevel: opts.headingLevel + 1,
                nested: true,
                hideTitle: true,
              }),
            )
          })
        } else {
          details.push(
            this.partials.signature(signatures[0], {
              headingLevel: opts.headingLevel,
              nested: true,
              hideTitle: true,
            }),
          )
        }
        md.push(`<details><summary>Details</summary>\n\n${details.filter(Boolean).join("\n\n")}\n\n</details>`)
      }

      // Remaining tags (excluding @example)
      if (mergedComment) {
        const remaining = {
          ...mergedComment,
          blockTags: (mergedComment.blockTags || []).filter((t) => t.tag !== "@example"),
        }
        md.push(
          this.partials.comment(remaining, {
            headingLevel: opts.headingLevel,
            showTags: true,
            showSummary: false,
          }),
        )
      }

      md.push(this.partials.inheritance(model, { headingLevel: opts.headingLevel }))

      return md.filter(Boolean).join("\n\n")
    }
  }
}

class ExampleFirstTheme extends MarkdownTheme {
  getRenderContext(page) {
    return new ExampleFirstContext(this, page, this.application.options)
  }
}

export function load(app) {
  app.renderer.defineTheme("example-first", ExampleFirstTheme)
}
