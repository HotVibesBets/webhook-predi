const express = require('express');
const app = express();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Middleware raw directamente en la ruta
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Error verificando firma:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    try {
      const creds = require('./credenciales_sheets.json');
      const doc = new GoogleSpreadsheet(sheetId);
      await doc.useServiceAccountAuth(creds);
      await doc.loadInfo();
      const sheet = doc.sheetsByIndex[0];

      await sheet.addRow({
        ID: session.id,
        Correo: session.customer_details?.email || 'Sin correo',
        Nombre: session.customer_details?.name || 'Sin nombre',
        Monto: session.amount_total / 100,
        Fecha: new Date().toLocaleString('es-MX'),
      });

      console.log('✅ Datos guardados en Google Sheets');
    } catch (error) {
      console.error('❌ Error al guardar en Sheets:', error.message);
    }
  }

  res.status(200).send();
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook escuchando en http://localhost:${PORT}/webhook`);
});
