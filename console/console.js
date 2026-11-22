/**
 * Transfer console: a small UI on top of src/transfer.js. Runs in the browser without a build step.
 */
(function () {
  'use strict';

  const { iban, money, transfer, accounts } = window.Woodgrove;
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
  }

  function updateDescriptionCount() {
    $('description-count').textContent = `${fields.description.value.length} / 140`;
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

    $('result-summary').innerHTML = `
      <dt>To</dt><dd>${result.beneficiaryName || '–'}<br><span class="mono">${iban.formatIban(result.toIban) || '–'}</span></dd>
      <dt>From</dt><dd class="mono">${iban.formatIban(result.fromIban)}</dd>
      <dt>Description</dt><dd>${result.description || '–'}</dd>
      <dt>Speed</dt><dd>${result.instant ? 'Instant' : 'Standard (next business day)'}</dd>
      <dt>Created</dt><dd>${new Date(result.createdAt).toLocaleString('en-GB')}</dd>`;

    $('result-errors').innerHTML = result.errors
      .map((error) => `<li><strong>${error.code}</strong> ${error.message}</li>`)
      .join('');

    $('result-json').textContent = JSON.stringify(result, null, 2);
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
    });
  });

  fields.toIban.addEventListener('input', updateIbanHint);
  fields.amount.addEventListener('input', updateAmountHint);
  fields.description.addEventListener('input', updateDescriptionCount);
})();
