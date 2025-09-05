// A tiny custom TypeDoc theme for typedoc-plugin-markdown
// Renders function sections as: name → examples → description → params → returns
// Usage: add this file as a plugin and set theme to "example-first" in typedoc.json.

import { ReflectionKind, translateTagName } from 'typedoc';
import { MarkdownTheme, MarkdownThemeContext } from 'typedoc-plugin-markdown';

class ExampleFirstContext extends MarkdownThemeContext {
  constructor(theme, page, options) {
    super(theme, page, options);

    const originalSignature = this.partials.signature.bind(this);

    // Override only the signature partial; keep everything else as-is
    this.partials.signature = (model, options = {}) => {
      const md = [];

      // Helper to create markdown heading text
      const heading = (level, text) => `${'#'.repeat(Math.max(1, level || 3))} ${text}`;

      // 1) Visible name heading only (hide full signature for the details block)
      if (!options.hideTitle) {
        const name = model.parent?.name || model.name;
        if (name && name !== '__call' && name !== '__type') {
          md.push(heading(options.headingLevel || 3, name));
        }
      }

      // 2) Sources (if not disabled and not nested)
      if (!options.nested && model.sources && !this.options.getValue('disableSources')) {
        md.push(this.partials.sources(model));
      }

      // Build a comment object similar to the default implementation
      let modelComments = options.multipleSignatures
        ? model.comment
        : model.comment || model.parent?.comment;

      if (modelComments && model.parent?.comment?.summary && !options.multipleSignatures) {
        modelComments = Object.assign({}, modelComments, {
          summary: model.parent.comment.summary,
        });
      }
      if (modelComments && model.parent?.comment?.blockTags) {
        modelComments = Object.assign({}, modelComments, {
          blockTags: [
            ...(model.parent?.comment?.blockTags || []),
            ...(model.comment?.blockTags || []),
          ],
        });
      }

      // 3) Examples first (just the @example tags)
      if (modelComments?.blockTags?.length) {
        const exampleTags = modelComments.blockTags.filter((t) => t.tag === '@example');
        if (exampleTags.length) {
          const exampleHeading = translateTagName('@example'); // Localized label
          md.push(heading(options.headingLevel || 3, exampleHeading));
          const examplesMd = exampleTags
            .map((tag) => this.helpers.getCommentParts(tag.content))
            .join('\n\n');
          md.push(examplesMd);
        }
      }

      // 4) Description (summary only, no tags)
      if (modelComments?.summary?.length) {
        md.push(this.helpers.getCommentParts(modelComments.summary));
      }

      // 5) Documents (remarks/links) from the parent
      if (!options.multipleSignatures && model.parent?.documents) {
        md.push(
          this.partials.documents(model.parent, {
            headingLevel: options.headingLevel,
          })
        );
      }

      // 6) Type parameters (skip for constructor signatures)
      if (model.typeParameters?.length && model.kind !== ReflectionKind.ConstructorSignature) {
        md.push(heading(options.headingLevel || 3, ReflectionKind.pluralString(ReflectionKind.TypeParameter)));
        if (this.helpers.useTableFormat('parameters')) {
          md.push(this.partials.typeParametersTable(model.typeParameters));
        } else {
          md.push(
            this.partials.typeParametersList(model.typeParameters, {
              headingLevel: options.headingLevel,
            })
          );
        }
      }

      // 7) Details block with signature and parameters
      {
        const details = [];
        // Signature (code block)
        details.push(
          this.partials.signatureTitle(model, {
            accessor: options.accessor,
          })
        );
        // Parameters table/list (if any)
        if (model.parameters?.length) {
          details.push(heading(options.headingLevel || 3, ReflectionKind.pluralString(ReflectionKind.Parameter)));
          if (this.helpers.useTableFormat('parameters')) {
            details.push(this.partials.parametersTable(model.parameters));
          } else {
            details.push(
              this.partials.parametersList(model.parameters, {
                headingLevel: options.headingLevel,
              })
            );
          }
        }

        // Wrap details in a GitHub-compatible collapsible block
        // Ensure a blank line after <summary> for proper rendering of code fences inside
        md.push(`<details><summary>details</summary>\n\n${details.filter(Boolean).join('\n\n')}\n\n</details>`);
      }

      // 8) Returns
      if (model.type) {
        md.push(
          this.partials.signatureReturns(model, {
            headingLevel: options.headingLevel,
          })
        );
      }

      // 9) Remaining tags (excluding @example) and inheritance info
      if (modelComments) {
        // Render non-example tags by temporarily filtering out @example
        const remaining = Object.assign({}, modelComments, {
          blockTags: (modelComments.blockTags || []).filter((t) => t.tag !== '@example'),
        });
        md.push(
          this.partials.comment(remaining, {
            headingLevel: options.headingLevel,
            showTags: true,
            showSummary: false,
          })
        );
      }

      md.push(this.partials.inheritance(model, { headingLevel: options.headingLevel }));

      return md.filter(Boolean).join('\n\n');
    };
  }
}

class ExampleFirstTheme extends MarkdownTheme {
  getRenderContext(page) {
    return new ExampleFirstContext(this, page, this.application.options);
  }
}

export function load(app) {
  app.renderer.defineTheme('example-first', ExampleFirstTheme);
}
