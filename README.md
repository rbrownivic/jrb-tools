# VMware Estate Capacity Workbench

Static GitHub Pages application for VMware capacity planning.

## Included now

- Landing page with a tool catalogue shell.
- Sizer tool for primary and DR workload capture.
- HPE ProLiant host catalogue with family, generation, CPU, and memory filtering.
- N+1 host count calculation per site using target `vCPU:pCPU` and `vMem:pMem` ratios.

## Publish on GitHub Pages

1. Push the repository to GitHub.
2. Enable Pages from the repository root.
3. Serve `index.html` as the site entry point.

## Notes

- The app is pure HTML, CSS, and JavaScript. No build step is required.
- Hardware values are a curated planning dataset. Validate final platform choices against current HPE QuickSpecs and VMware support guidance.
