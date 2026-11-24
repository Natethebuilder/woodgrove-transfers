describe('payee (WGB-102)', () => {
  const { verifyPayee } = Woodgrove.payee;
  const JAN = 'NL20WGBK0123456789';

  test('the exact name is a MATCH', () => {
    expect(verifyPayee(JAN, 'Jan de Vries')).toEqual({ result: 'MATCH' });
  });

  test('case, accents and extra spaces are ignored', () => {
    expect(verifyPayee(JAN, '  JAN   de vries ')).toEqual({ result: 'MATCH' });
    expect(verifyPayee('NL54WGBK9876543210', 'Emilie van den Berg')).toEqual({ result: 'MATCH' });
  });

  test('the IBAN may contain spaces', () => {
    expect(verifyPayee('nl20 wgbk 0123 4567 89', 'Jan de Vries')).toEqual({ result: 'MATCH' });
  });

  test('initials are a CLOSE_MATCH with the holder name', () => {
    expect(verifyPayee(JAN, 'J. de Vries')).toEqual({ result: 'CLOSE_MATCH', suggestedName: 'Jan de Vries' });
  });

  test('up to two typos are a CLOSE_MATCH', () => {
    expect(verifyPayee(JAN, 'Jan de Vris')).toEqual({ result: 'CLOSE_MATCH', suggestedName: 'Jan de Vries' });
    expect(verifyPayee(JAN, 'Jen de Vris')).toEqual({ result: 'CLOSE_MATCH', suggestedName: 'Jan de Vries' });
  });

  test('three typos are NO_MATCH', () => {
    expect(verifyPayee(JAN, 'Jen do Vris')).toEqual({ result: 'NO_MATCH' });
  });

  test('another name is NO_MATCH', () => {
    expect(verifyPayee(JAN, 'Piet Jansen')).toEqual({ result: 'NO_MATCH' });
    expect(verifyPayee(JAN, 'P. de Vries')).toEqual({ result: 'NO_MATCH' });
    expect(verifyPayee(JAN, '')).toEqual({ result: 'NO_MATCH' });
  });

  test('an account outside Woodgrove is NOT_POSSIBLE', () => {
    expect(verifyPayee('FR76 3000 6000 0112 3456 7890 189', 'Claire Dubois')).toEqual({ result: 'NOT_POSSIBLE' });
    expect(verifyPayee('', 'Jan de Vries')).toEqual({ result: 'NOT_POSSIBLE' });
  });
});
