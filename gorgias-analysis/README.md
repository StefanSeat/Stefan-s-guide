# Gorgias sales tactics map

Backup of the "Gorgias Sales Tactics" artifact (a mind map of how Gorgias sells, built for a job application).

- Live page: https://claude.ai/artifact/N2yedPqBYewXCG2APUb95X
- `gorgias-sales-tactics.html`: the page source as published.
- `cards.json`: every tactic card (stored in the page's database, collection `cards`), keyed by card id.

## Restore

Ask Claude to republish `gorgias-sales-tactics.html` to the artifact URL above (or as a new artifact with `capabilities: {db: {}, user: {}}`), then write each entry of `cards.json` back into the `cards` collection with the same id.
