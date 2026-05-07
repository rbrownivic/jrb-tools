# VMware Estate Capacity Workbench

Static GitHub Pages application for VMware capacity planning.

## Included now

- Landing page with a tool catalogue shell.
- Sizer tool for primary and DR workload capture.
- HPE ProLiant host catalogue with family, generation, CPU, and memory filtering.
- N+1 host count calculation per site using target `vCPU:pCPU` and `vMem:pMem` ratios.
- Capacity Snapshot Dashboard for browser-side review of exported JSON facts.
- GPO Inventory Review page for browser-side review of exported `gpo-inventory-*` folders.

## Publish on GitHub Pages

1. Push the repository to GitHub.
2. Enable Pages from the repository root.
3. Serve `index.html` as the site entry point.

## Notes

- The app is pure HTML, CSS, and JavaScript. No build step is required.
- Hardware values are a curated planning dataset. Validate final platform choices against current HPE QuickSpecs and VMware support guidance.

## Capacity Snapshot Dashboard

- The PowerShell capacity checker now exports a stable JSON snapshot to `exports/capacity-facts-latest.json`.
- Open `capacity-dashboard.html` from the site home page and use `Import JSON` to load that file directly in the browser.
- The imported file is only used client-side for visualisation. It does not need to be committed to the repository.

## GPO Inventory Review

- Open `gpo-inventory-review.html` from the site home page and use `Import Folder` to select an exported `gpo-inventory-*` directory.
- The page expects `forest-summary.json` at the root plus `metadata.json` under each `domain/gpo-folder/` path.
- `settings.txt`, `permissions.csv`, and `report.xml` are loaded on demand when you expand a GPO row.
- Directory import support is best in Chromium-based browsers because the page uses the browser directory picker API.
