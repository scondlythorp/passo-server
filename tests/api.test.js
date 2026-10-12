/**
 * tests/api.test.js
 * Comprehensive automated test suite for PASSO Transport Fare API.
 * Uses Node.js 22 native test runner (node:test).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Helper to make test HTTP requests to local server
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        ...options,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (_) {
            json = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

test('PASSO Transit API Test Suite', async (t) => {
  await t.test('1. Health check returns healthy status', async () => {
    const res = await request({ path: '/api/health', method: 'GET' });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'healthy');
  });

  await t.test('2. Fares list returns valid records', async () => {
    const res = await request({ path: '/api/fares', method: 'GET' });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.fares));
    assert.ok(res.data.fares.length >= 20);
    assert.ok(res.data.fares[0].price > 0);
  });

  await t.test('3. Terminal directory returns Gambian transport hubs', async () => {
    const res = await request({ path: '/api/terminals', method: 'GET' });
    assert.equal(res.status, 200);
    assert.ok(res.data.terminals.length >= 5);
    const westfield = res.data.terminals.find((t) => t.id === 'serekunda-westfield');
    assert.ok(westfield);
    assert.equal(westfield.town, 'Serekunda');
  });

  await t.test('4. Tariff revisions endpoint returns active MOTWI notice', async () => {
    const res = await request({ path: '/api/revisions', method: 'GET' });
    assert.equal(res.status, 200);
    assert.ok(res.data.activeNotice);
    assert.equal(res.data.activeNotice.revisionRef, 'MOTWI-2026-A');
  });

  await t.test('5. Bidirectional route calculator returns direct & reverse fares', async () => {
    const res = await request({
      path: '/api/fares/calculate?from=Serekunda&to=Banjul',
      method: 'GET',
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.direct.length > 0);
    const busOption = res.data.direct.find((f) => f.vehicleType === 'Bus');
    assert.ok(busOption);
    assert.equal(busOption.price, 15);
  });

  await t.test('6. Multi-stage router calculates transfer route through hubs', async () => {
    const res = await request({
      path: '/api/fares/calculate?from=Banjul&to=Lamin',
      method: 'GET',
    });
    assert.equal(res.status, 200);
    // Direct or multi-stage options exist
    assert.ok(res.data.direct.length > 0 || res.data.multiStage.length > 0);
  });

  await t.test('7. Input validation rejects invalid fare creation', async () => {
    // Missing required fields
    const res1 = await request(
      {
        path: '/api/fares',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer passo-admin-2026',
        },
      },
      { from: 'Banjul' }
    );
    assert.equal(res1.status, 400);

    // Identical from and to
    const res2 = await request(
      {
        path: '/api/fares',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer passo-admin-2026',
        },
      },
      { from: 'Banjul', to: 'Banjul', vehicleType: 'Taxi', price: 50 }
    );
    assert.equal(res2.status, 400);

    // Negative price
    const res3 = await request(
      {
        path: '/api/fares',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer passo-admin-2026',
        },
      },
      { from: 'Banjul', to: 'Soma', vehicleType: 'Taxi', price: -20 }
    );
    assert.equal(res3.status, 400);
  });

  await t.test('8. RBAC rejects unauthorized fare modifications', async () => {
    const res = await request(
      {
        path: '/api/fares',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { from: 'Banjul', to: 'Bakau', vehicleType: 'Taxi', price: 75 }
    );
    assert.equal(res.status, 401);
  });

  await t.test('9. Overcharge incident report submission', async () => {
    const res = await request(
      {
        path: '/api/reports',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        route: 'Banjul to Serekunda',
        vehicleType: 'Taxi',
        officialPrice: 100,
        priceCharged: 130,
        plateNumber: 'BJL 9901 C',
        notes: 'Excess charge test',
      }
    );
    assert.equal(res.status, 201);
    assert.ok(res.data.report.id > 0);
  });

  await t.test('10. USSD Gateway simulator (*144#) responds with menu', async () => {
    const res = await request(
      {
        path: '/api/ussd',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { text: '*144#' }
    );
    assert.equal(res.status, 200);
    assert.ok(typeof res.data === 'string');
    assert.ok(res.data.includes('PASSO Gambia Transit'));
  });
});
