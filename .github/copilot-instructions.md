# Woodgrove Transfers house rules

- Money is always an integer number of cents. Never use floating-point euros.
- Show amounts to customers with formatAmount from src/money.js, for example € 1.234,56.
- Never log or return full IBANs or customer names. Mask IBANs with maskIban from src/iban.js.
- Validation errors have an UPPER_SNAKE_CASE code, such as INVALID_AMOUNT, and a plain-English message.
- Every behaviour change comes with tests in tests/. Run them with node tests/run.js, or open tests/index.html if Node isn't installed.
- Keep the UMD wrapper in every file in src/, so the code runs in the browser and in Node without a build step. Add no dependencies.
