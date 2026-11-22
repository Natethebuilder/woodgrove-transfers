/**
 * Transfer console: a small UI on top of src/transfer.js. Runs in the browser without a build step.
 */
(function () {
  'use strict';

  const { iban, money, transfer, accounts, payee } = window.Woodgrove;
  const $ = (id) => document.getElementById(id);

  const form = $('transfer-form');
  const fields = {
    fromIban: $('fromIban'),
    toIban: $('toIban'),
    beneficiaryName: $('beneficiaryName'),
    amount: $('amount'),
    description: $('description'),
    instant: $('instant'),
  };

  const EXAMPLES = {
    claire: { toIban: 'FR76 3000 6000 0112 3456 7890 189', beneficiaryName: 'Claire Dubois', amount: '125,00', description: 'Invoice 2026-114' },
    giulia: { toIban: 'IT21 A030 6909 6061 0000 0063 789', beneficiaryName: 'Giulia Romano', amount: '480,00', description: 'Apartment Milan, December' },
    jan: { toIban: 'NL20 WGBK 0123 4567 89', beneficiaryName: 'Jan de Vries', amount: '42,50', description: 'Dinner' },
    big: { toIban: 'DE89 3704 0044 0532 0130 00', beneficiaryName: 'Autohaus Müller GmbH', amount: '27.500,00', description: 'Car' },
  };

  // Fill the "From" list with Woodgrove's own accounts.
  Object.keys(accounts).forEach((accountIban) => {
    const option = document.createElement('option');
    option.value = accountIban;
    option.textContent = `${accounts[accountIban]} · ${iban.formatIban(accountIban)}`;
    fields.fromIban.appendChild(option);
  });
  fields.fromIban.value = 'NL12WGBK0417164300';

  function readRequest() {
    return {
      fromIban: fields.fromIban.value,
      toIban: fields.toIban.value,
      beneficiaryName: fields.beneficiaryName.value,
      amountCents: money.parseAmount(fields.amount.value),
      description: fields.description.value,
      instant: fields.instant.checked,
    };
  }

  function updateIbanHint() {
    const hint = $('iban-hint');
    const value = fields.toIban.value;
    hint.className = 'hint';
    if (!value.trim()) {
      hint.textContent = "Enter the beneficiary's IBAN.";
    } else if (iban.isValidIban(value)) {
      const country = iban.countryOf(value);
      hint.textContent = `✓ ${iban.formatIban(value)} · ${country}${iban.isSepaCountry(country) ? ' · SEPA' : ' · outside SEPA'}`;
      hint.classList.add('ok');
    } else {
      hint.textContent = 'This IBAN does not look valid yet.';
      hint.classList.add('warn');
    }
  }

  function updateAmountHint() {
    const cents = money.parseAmount(fields.amount.value);
    const hint = $('amount-hint');
    hint.textContent = Number.isInteger(cents) ? money.formatAmount(cents) : 'For example 1.234,56';
    updateFeeHint();
  }

  function updateFeeHint() {
    const fee = transfer.calculateFee(money.parseAmount(fields.amount.value), fields.instant.checked);
    $('fee-hint').textContent = fields.instant.checked
      ? `Arrives within 10 seconds. Fee ${money.formatAmount(fee)}.`
      : 'Standard transfers are free.';
  }

  function updateDescriptionCount() {
    $('description-count').textContent = `${fields.description.value.length} / 140`;
  }

  // Verification of Payee (WGB-102): check the name against the account while the customer types.
  const PAYEE_MESSAGES = {
    MATCH: () => '✅ Name matches',
    CLOSE_MATCH: (check) => `⚠️ Did you mean ${check.suggestedName}?`,
    NO_MATCH: () => "❌ Name doesn't match this account",
    NOT_POSSIBLE: () => 'ℹ️ Name check not possible for this bank',
  };

  function updatePayeeCheck() {
    const hint = $('name-hint');
    if (!fields.beneficiaryName.value.trim() || !iban.isValidIban(fields.toIban.value)) {
      hint.className = 'hint';
      hint.textContent = "The name on the beneficiary's account.";
      return;
    }
    const check = payee.verifyPayee(fields.toIban.value, fields.beneficiaryName.value);
    hint.className = `hint vop ${check.result.toLowerCase().replace('_', '-')}`;
    hint.textContent = PAYEE_MESSAGES[check.result](check);
  }

  function render(result) {
    $('result-empty').hidden = true;
    $('result-body').hidden = false;

    const accepted = result.status === 'ACCEPTED';
    const status = $('result-status');
    status.textContent = result.status;
    status.className = `status ${accepted ? 'accepted' : 'rejected'}`;
    $('result-id').textContent = result.id;
    $('result-amount').textContent = Number.isInteger(result.amountCents) ? money.formatAmount(result.amountCents) : '€ –';

    // Build the DOM with textContent only: names and descriptions are user input (WGB-103).
    const summary = $('result-summary');
    summary.replaceChildren();
    const addRow = (label, value, className) => {
      const dd = el('dd', value, className);
      summary.append(el('dt', label), dd);
      return dd;
    };
    const to = addRow('To', result.beneficiaryName || '–');
    to.append(document.createElement('br'), el('span', iban.formatIban(result.toIban) || '–', 'mono'));
    addRow('From', iban.formatIban(result.fromIban), 'mono');
    addRow('Description', result.description || '–');
    addRow('Speed', result.instant ? 'Instant' : 'Standard (next business day)');
    addRow('Fee', money.formatAmount(result.feeCents));
    addRow('Created', new Date(result.createdAt).toLocaleString('en-GB'));

    $('result-errors').replaceChildren(
      ...result.errors.map((error) => {
        const item = el('li', ` ${error.message}`);
        item.prepend(el('strong', error.code));
        return item;
      })
    );

    $('result-json').textContent = JSON.stringify(result, null, 2);
  }

  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render(transfer.createTransfer(readRequest()));
  });

  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      const example = EXAMPLES[button.dataset.example];
      Object.keys(example).forEach((name) => {
        fields[name].value = example[name];
      });
      updateIbanHint();
      updateAmountHint();
      updateDescriptionCount();
      updatePayeeCheck();
    });
  });

  fields.toIban.addEventListener('input', updateIbanHint);
  fields.toIban.addEventListener('input', updatePayeeCheck);
  fields.beneficiaryName.addEventListener('input', updatePayeeCheck);
  fields.amount.addEventListener('input', updateAmountHint);
  fields.instant.addEventListener('change', updateFeeHint);
  updateFeeHint();
  fields.description.addEventListener('input', updateDescriptionCount);
})();
