const express = require('express');
const app = express();
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// IMPORTANTE: esto es lo que permite leer el body crudo
app.use('/webhook', express.raw({ type: 'application/json' }));

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
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
        Correo: session.customer_details.email,
        Nombre: session.customer_details.name,
        Monto: session.amount_total / 100,
        Fecha: new Date().toLocaleString(),
      });

      console.log('✅ Datos guardados en Google Sheets');
    } catch (error) {
      console.error('❌ Error al guardar en Sheets:', error.message);
    }
  }

  res.status(200).send();
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Webhook escuchando en http://localhost:${PORT}/webhook`));
