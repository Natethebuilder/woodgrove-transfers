describe('server (WGB-103)', () => {
  // The HTTP API only exists in Node. In the browser runner these tests are skipped.
  if (typeof window !== 'undefined' || typeof require !== 'function') {
    test('server tests run in Node only (node tests/run.js)', () => {});
    return;
  }

  const http = require('node:http');
  const server = require('../server');
  const transfers = require('../src/transfer');

  async function call(method, path, body) {
    await new Promise((resolve) => server.listen(0, resolve));
    try {
      return await new Promise((resolve, reject) => {
        const req = http.request({ port: server.address().port, method, path }, (res) => {
          let text = '';
          res.on('data', (chunk) => (text += chunk));
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(text) }));
        });
        req.on('error', reject);
        req.end(body);
      });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  test('a 500 response does not reveal the stack trace', async () => {
    const original = transfers.createTransfer;
    const originalError = console.error;
    transfers.createTransfer = () => {
      throw new Error('database password is hunter2');
    };
    console.error = () => {};
    try {
      const response = await call('POST', '/transfers', '{}');
      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(JSON.stringify(response.body)).not.toContain('hunter2');
      expect(response.body.error.stack).toBeUndefined();
    } finally {
      transfers.createTransfer = original;
      console.error = originalError;
    }
  });

  test('rejects request bodies larger than 100 KB', async () => {
    const response = await call('POST', '/transfers', JSON.stringify({ description: 'x'.repeat(200 * 1024) }));
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  test('a badly encoded IBAN in the URL is a 400, not a crash', async () => {
    const response = await call('GET', '/ibans/%E0%A4%A');
    expect(response.status).toBe(400);
  });

  test('the screening API key is not hardcoded', () => {
    expect(Woodgrove.config.screening.apiKey).not.toMatch(/^wgb_live_/);
  });
});
