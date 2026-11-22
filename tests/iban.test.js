describe('iban', () => {
  const { normalizeIban, isValidIban, formatIban, countryOf, isSepaCountry, maskIban } = Woodgrove.iban;

  test('normalizeIban removes spaces and uses capital letters', () => {
    expect(normalizeIban('nl91 abna 0417 1643 00')).toBe('NL91ABNA0417164300');
  });

  test('normalizeIban returns an empty string for missing input', () => {
    expect(normalizeIban(null)).toBe('');
    expect(normalizeIban(undefined)).toBe('');
  });

  test('isValidIban accepts valid Dutch IBANs', () => {
    expect(isValidIban('NL91ABNA0417164300')).toBe(true);
    expect(isValidIban('NL20WGBK0123456789')).toBe(true);
  });

  test('isValidIban accepts IBANs from other SEPA countries', () => {
    expect(isValidIban('DE89370400440532013000')).toBe(true);
    expect(isValidIban('BE68539007547034')).toBe(true);
    expect(isValidIban('ES9121000418450200051332')).toBe(true);
    expect(isValidIban('GB82WEST12345698765432')).toBe(true);
    expect(isValidIban('FR7630006000011234567890189')).toBe(true);
  });

  test('isValidIban accepts spaces and lowercase letters', () => {
    expect(isValidIban('nl91 abna 0417 1643 00')).toBe(true);
  });

  test('isValidIban rejects wrong check digits', () => {
    expect(isValidIban('NL92ABNA0417164300')).toBe(false);
    expect(isValidIban('DE88370400440532013000')).toBe(false);
  });

  test('isValidIban rejects a typo in the account number', () => {
    expect(isValidIban('NL91ABNA0417164301')).toBe(false);
  });

  test('isValidIban rejects the wrong length for the country', () => {
    expect(isValidIban('NL91ABNA041716430')).toBe(false);
    expect(isValidIban('NL91ABNA04171643000')).toBe(false);
  });

  test('isValidIban rejects unknown countries and garbage', () => {
    expect(isValidIban('XX91ABNA0417164300')).toBe(false);
    expect(isValidIban('not an iban')).toBe(false);
    expect(isValidIban('')).toBe(false);
  });

  test('isValidIban rejects values that are not strings', () => {
    expect(isValidIban(null)).toBe(false);
    expect(isValidIban(undefined)).toBe(false);
    expect(isValidIban(91)).toBe(false);
  });

  test('formatIban prints groups of four', () => {
    expect(formatIban('NL91ABNA0417164300')).toBe('NL91 ABNA 0417 1643 00');
    expect(formatIban('be68 5390 0754 7034')).toBe('BE68 5390 0754 7034');
  });

  test('countryOf returns the country code', () => {
    expect(countryOf('nl91abna0417164300')).toBe('NL');
    expect(countryOf('')).toBe('');
  });

  test('isSepaCountry knows SEPA countries', () => {
    expect(isSepaCountry('NL')).toBe(true);
    expect(isSepaCountry('ch')).toBe(true);
    expect(isSepaCountry('TR')).toBe(false);
  });

  test('maskIban keeps the country code and the last four characters', () => {
    expect(maskIban('NL91ABNA0417164300')).toBe('NL************4300');
    expect(maskIban('fr76 3000 6000 0112 3456 7890 189')).toBe('FR*********************0189');
  });

  test('maskIban returns an empty string for empty input', () => {
    expect(maskIban('')).toBe('');
    expect(maskIban(null)).toBe('');
  });
});
