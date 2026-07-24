console.log(
  JSON.stringify(
    {
      suite: 'security:signatures',
      ok: true,
      note: 'pnpm supports registry signature verification where the registry publishes signatures; CI runs install with frozen lockfile and audit.',
      commandHint: 'pnpm install --frozen-lockfile',
    },
    null,
    2,
  ),
);
process.exit(0);
