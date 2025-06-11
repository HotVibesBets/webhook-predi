require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const CREDENCIALES = require('./credenciales_sheets.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.warn('⚠️  Error validando firma:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📩 Evento recibido: ${event.type}`);
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('🧾 Datos de la sesión recibida:', session);

    const nombre = session.customer_details?.name || '';
    const email = session.customer_details?.email || '';
    const telefono = session.customer_details?.phone || '';

    try {
      const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
      await doc.useServiceAccountAuth(CREDENCIALES);
      await doc.loadInfo();

      const sheet = doc.sheetsByTitle['Contactos_forms'];
      await sheet.addRow({
        Nombre: nombre,
        Contacto: telefono,
        Correo: email,
        Status: 'Activo',
        'Día y hora de inicio de prueba': new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
      });

      console.log(`✅ Cliente agregado: ${nombre}`);
    } catch (error) {
      console.error('❌ Error al guardar en Google Sheets:', error);
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook escuchando en http://localhost:${PORT}/webhook`);
});
