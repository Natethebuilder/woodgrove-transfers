# Woodgrove Transfers

**Woodgrove Transfers** is the payment transfer service of Woodgrove Bank. It checks IBANs, validates SEPA transfers and turns them into transfers that the bank can send. It is small on purpose, so you can explore it, change it and ship it in a 30-minute hands-on lab with GitHub Copilot in VS Code.

> [!NOTE]
> Woodgrove Bank is a fictional bank. All people, accounts, IBANs and keys in this repository are made up for training purposes.

👉 **Workshop guide:** https://natethebuilder.github.io/rabobank-copilot-workshop/#/lab

## Get started

You need **VS Code**, **Git** and a **GitHub Copilot** sign-in. Nothing else to install: there are no dependencies and no build step.

1. At the top of this page, select **Use this template** → **Create a new repository**.
2. Choose yourself (or your team's sandbox organisation) as owner, select **Private**, then **Create repository**.
3. In VS Code, open the Command Palette (<kbd>Ctrl+Shift+P</kbd> / <kbd>⇧⌘P</kbd>) → **Git: Clone** → paste the URL of your new repository.
4. Open the folder and select **Trust** when VS Code asks.

No VS Code on your machine? Open your copy on github.com and select **Code** → **Codespaces** → **Create codespace**.

## Run the tests

Choose whichever works on your machine. Both run the same tests.

| With Node.js (18 or later) | Without Node.js |
|---|---|
| `node tests/run.js` (or `npm test`) in the terminal | Open `tests/index.html` in a browser, or in the VS Code integrated browser |

The browser tab title shows the result, for example `✓ 30 passed` or `✗ 1 failed`.

## Try the transfer console

Open `console/index.html` in a browser to send a (pretend) transfer and see the result and the JSON that the service returns.

With Node.js you can also start the API, which serves the same console at http://localhost:3000:

```bash
node server.js
curl http://localhost:3000/health
curl http://localhost:3000/ibans/NL91ABNA0417164300
```

Set `PORT` to use another port.

## Project map

```text
src/
  iban.js          normalizeIban, isValidIban, formatIban, countryOf, isSepaCountry
  money.js         parseAmount ("1.234,56" → 123456 cents) and formatAmount (123456 → "€ 1.234,56")
  transfer.js      validateTransfer and createTransfer
  config.js        transfer limits and service configuration
data/
  accounts.js      Woodgrove's own accounts: IBAN → account holder
console/           the transfer console (index.html, console.js, console.css)
server.js          optional HTTP API: GET /health, GET /ibans/:iban, POST /transfers
tests/
  *.test.js        the tests
  harness.js       a tiny test framework (describe, test, expect)
  run.js           Node runner
  index.html       browser runner
docs/tickets/      the team's backlog: WGB-101 … WGB-106
```

## How the code is put together

- **Money is integer cents.** `12500` means € 125,00.
- **No build step.** Every file in `src/` and `data/` uses a small wrapper, so it works with `require()` in Node and with a plain `<script>` tag in the browser (as `Woodgrove.iban`, `Woodgrove.transfer` and so on).
- **Two test runners, one set of tests.** When you add a file to `src/`, `data/` or `tests/`, also add a `<script>` tag for it to `tests/index.html`. `node tests/run.js` tells you which line to add if you forget.

A transfer request looks like this:

```json
{
  "fromIban": "NL20WGBK0123456789",
  "toIban": "FR7630006000011234567890189",
  "beneficiaryName": "Claire Dubois",
  "amountCents": 12500,
  "description": "Invoice 2026-114",
  "instant": false
}
```
