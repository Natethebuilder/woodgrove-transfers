describe('money', () => {
  const { parseAmount, formatAmount } = Woodgrove.money;

  test('parseAmount reads Dutch notation', () => {
    expect(parseAmount('12,50')).toBe(1250);
    expect(parseAmount('1.234,56')).toBe(123456);
    expect(parseAmount('25.000')).toBe(2500000);
  });

  test('parseAmount accepts whole euros, one decimal and a euro sign', () => {
    expect(parseAmount('99')).toBe(9900);
    expect(parseAmount('0,5')).toBe(50);
    expect(parseAmount('€ 7,25')).toBe(725);
    expect(parseAmount('  42  ')).toBe(4200);
  });

  test('parseAmount accepts a decimal point', () => {
    expect(parseAmount('12.50')).toBe(1250);
  });

  test('parseAmount returns NaN for input it cannot read', () => {
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('abc')).toBeNaN();
    expect(parseAmount('-5')).toBeNaN();
    expect(parseAmount('1,234')).toBeNaN();
    expect(parseAmount(12.5)).toBeNaN();
  });

  test('formatAmount shows euros the Dutch way', () => {
    expect(formatAmount(123456)).toBe('€ 1.234,56');
    expect(formatAmount(2500000)).toBe('€ 25.000,00');
  });

  test('formatAmount shows small amounts with two decimals', () => {
    expect(formatAmount(0)).toBe('€ 0,00');
    expect(formatAmount(20)).toBe('€ 0,20');
  });

  test('formatAmount only accepts integer cents', () => {
    expect(() => formatAmount(12.5)).toThrow('integer number of cents');
    expect(() => formatAmount('100')).toThrow(TypeError);
  });
});
