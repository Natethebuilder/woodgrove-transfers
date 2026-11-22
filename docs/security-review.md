# Security and privacy review (WGB-103)

Review of Woodgrove Transfers before the internal audit: logs, secrets, user input and error responses.

| # | Severity | File | Finding | Status |
|---|---|---|---|---|
| 1 | High | `src/transfer.js` | `createTransfer` logged full IBANs and the beneficiary name with `console.log`. Logs are kept longer and read by more people than transaction data. | Fixed: IBANs are masked with `maskIban`, names are not logged. Test in `tests/transfer.test.js`. |
| 2 | High | `src/config.js` | The screening API key (`wgb_live_…`) was hardcoded and committed. Anyone with read access to the repository could use it. | Fixed: read from the `WGB_SCREENING_API_KEY` environment variable. **Rotate the old key**: it stays in the Git history. Test in `tests/server.test.js`. |
| 3 | High | `console/console.js` | The result panel rendered the beneficiary name, the description and error messages with `innerHTML`: a description such as `<img src=x onerror=alert(1)>` runs script (XSS). | Fixed: the DOM is built with `textContent`. |
| 4 | High | `server.js` | 500 responses returned `err.message` and `err.stack`, which reveal internals (file paths, library versions, sometimes data). | Fixed: generic message; details are logged on the server only. Test in `tests/server.test.js`. |
| 5 | High | `server.js` | No limit on the request body size: one large request can exhaust the server's memory. | Fixed: 100 KB limit, `413 PAYLOAD_TOO_LARGE`. Test in `tests/server.test.js`. |
| 6 | Medium | `server.js` | `GET /ibans/:iban` crashed with a 500 on badly encoded URLs (`decodeURIComponent` throws). | Fixed: `400 INVALID_REQUEST`. Test in `tests/server.test.js`. |
| 7 | Low | `server.js` | No security headers (`Content-Security-Policy`, `X-Content-Type-Options`) on the console pages. | Open. |
| 8 | Low | `src/transfer.js` | Transfer ids are sequential and predictable. Fine for this demo; use random ids before ids are exposed to customers. | Open. |
