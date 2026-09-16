# Example: A Multi-File Product Publication Candidate

This fictional writing-group increment illustrates the schema-6 review unit. It
is not an approved product, research evidence, or a publication performed by the
installer. The paths beneath this directory model a change root.

- `prd.md` and `prd/capabilities/` describe the increment.
- `product-docs/prd.md` is a concise product opening with two indexes.
- Invitations are a user capability; access control is a shared system capability.
- Detailed requirements and the invitation flow live in their respective pages.
- `product-publication.yaml` maps the complete candidate, including MkDocs, to an
  initially absent baseline. Its plan contains no implicit deletions.

Approval would hash the increment, two indexed PRDs, plan, and five mapped files
(nine files total), but would not create the published targets. Archive would
verify that every baseline target is still absent, stage/check the exact reviewed
files, publish them, write derived provenance, then archive the change/history.

For an existing product, first carry forward every unaffected page and replace
`absent` with actual baseline hashes. Preserve the site's unrelated nav/settings.
A changed baseline or candidate requires a new review and approval. Never use this
example's empty baseline to overwrite an existing product.
