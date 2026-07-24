# Diagnostics

```text
pnpm diagnostics:create
```

Creates a redacted local diagnostic bundle. Excludes:

- Live database files
- Raw snapshot payloads
- User documents
- Personalisation export payloads
- Platform/X current text
- Secrets and absolute paths

Bundles are for local support only and must not be uploaded to untrusted hosts.
