🚀 Instrucciones para desplegar en Render

1. Sube esta carpeta como repositorio a GitHub
2. Entra a https://dashboard.render.com y crea un nuevo Web Service
3. Conecta tu repo y configura:
   - Build command: npm install
   - Start command: npm start
4. Agrega estas variables de entorno en Render:
   - STRIPE_SECRET_KEY (tu clave sk_test)
   - STRIPE_WEBHOOK_SECRET (tu clave whsec)
   - GOOGLE_SHEET_ID (el ID de tu hoja)
5. Sube también tu archivo credenciales_sheets.json
6. Pega la URL final en tu webhook de Stripe
