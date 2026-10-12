/**
 * backend/resources/ussd/ussd.router.js
 * USSD & SMS Gateway Simulator (*144# PASSO Gambia)
 */

const express = require('express');
const router = express.Router();
const faresDb = require('../fares/fares.db');

router.post('/', (req, res) => {
  const { sessionId, phoneNumber, text = '' } = req.body;
  const input = text.trim();
  const parts = input.split('*').filter(Boolean);

  let response = '';

  if (input === '' || input === '*144#') {
    response = `CON PASSO Gambia Transit (*144#)
1. Check Route Fare
2. Nearest Car Park
3. Report Overcharge
4. Transport Union Helpline`;
  } else if (parts[0] === '1') {
    if (parts.length === 1) {
      response = `CON Select Origin:
1. Banjul
2. Serekunda
3. Brikama
4. Soma
5. Farafenni
6. Lamin`;
    } else if (parts.length === 2) {
      const townMap = { '1': 'Banjul', '2': 'Serekunda', '3': 'Brikama', '4': 'Soma', '5': 'Farafenni', '6': 'Lamin' };
      const fromTown = townMap[parts[1]] || 'Banjul';
      response = `CON Origin: ${fromTown}
Select Destination:
1. Banjul
2. Serekunda
3. Brikama
4. Soma
5. Farafenni
6. Lamin`;
    } else if (parts.length === 3) {
      const townMap = { '1': 'Banjul', '2': 'Serekunda', '3': 'Brikama', '4': 'Soma', '5': 'Farafenni', '6': 'Lamin' };
      const from = townMap[parts[1]];
      const to = townMap[parts[2]];

      if (!from || !to || from === to) {
        response = `END Invalid route combination. Please try again.`;
      } else {
        const result = faresDb.calculateRoute(from, to);
        if (result.direct && result.direct.length > 0) {
          const fareLines = result.direct.map((f) => `${f.vehicleType}: D${f.price}`).join(', ');
          response = `END Official Fares ${from} to ${to}:
${fareLines}
(Gazette Regulated MOTWI-2026)`;
        } else if (result.multiStage && result.multiStage.length > 0) {
          const best = result.multiStage[0];
          response = `END ${from} to ${to} (Transfer at ${best.transferHub}):
Total: D${best.totalPrice} (${best.vehicleType})
Leg 1: D${best.legs[0].price}, Leg 2: D${best.legs[1].price}`;
        } else {
          response = `END No direct tariff found. Ask at nearest terminal.`;
        }
      }
    }
  } else if (parts[0] === '2') {
    response = `END Major Hubs:
Westfield Garage (Serekunda, 24/7)
Albert Market Terminal (Banjul)
Brikama College Road Park
Soma Crossing Hub`;
  } else if (parts[0] === '3') {
    response = `END To report overcharge via SMS, text:
REPORT <PLATE> <ROUTE> <PRICE_PAID>
to 1440. Free on Gamcel/Africell/QCell.`;
  } else if (parts[0] === '4') {
    response = `END Gambia Transport Union (GTU) Toll-Free: 199.
Police Traffic Division: 117.`;
  } else {
    response = `END Invalid selection. Dial *144# to start.`;
  }

  res.set('Content-Type', 'text/plain');
  res.status(200).send(response);
});

module.exports = router;
