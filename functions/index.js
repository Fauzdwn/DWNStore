// This is a placeholder for a serverless function (e.g., Firebase Cloud Function).
// You should deploy this code to a secure backend environment.
// Do not expose this code on the client-side.

// In a real backend environment, you would use environment variables to store your keys.
// For Firebase Functions, you can set them using:
// firebase functions:config:set fonnte.token="YOUR_FONNTE_API_KEY"
// firebase functions:config:set firebase.apikey="YOUR_FIREBASE_API_KEY"
// ...and so on for the rest of the firebase config.

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch'); // Use node-fetch for making HTTP requests in Node.js

// Initialize Firebase Admin SDK
// The SDK automatically finds the configuration from the environment
// when deployed to Firebase Cloud Functions.
admin.initializeApp();
const db = admin.database();

// --- Function to get products (will be expanded later for popularity) ---
// This function can be triggered via an HTTP request.
// The frontend would call this endpoint instead of accessing the database directly.
exports.getProducts = functions.https.onCall(async (data, context) => {
  try {
    // 1. Fetch all products and buyers in parallel
    const [productsSnapshot, buyersSnapshot] = await Promise.all([
      db.ref('produk').once('value'),
      db.ref('buyer').once('value')
    ]);

    const products = [];
    const purchaseCounts = {};

    // 2. Calculate purchase counts
    if (buyersSnapshot.exists()) {
      buyersSnapshot.forEach(buyerChild => {
        const buyer = buyerChild.val();
        if (buyer.produkId) {
          purchaseCounts[buyer.produkId] = (purchaseCounts[buyer.produkId] || 0) + 1;
        }
      });
    }

    // 3. Add purchaseCount to each product
    productsSnapshot.forEach(productChild => {
      const product = productChild.val();
      products.push({
        id: productChild.key,
        ...product,
        purchaseCount: purchaseCounts[productChild.key] || 0 // Add purchase count, default to 0
      });
    });

    return products;

  } catch (error) {
    console.error("Error getting products with popularity:", error);
    throw new functions.https.HttpsError('internal', 'Could not fetch products.');
  }
});


// --- Function to handle a purchase ---
// This function will be called from `beli/index.html`.
// It securely handles the Fonnte API call on the backend.
exports.processPurchase = functions.https.onCall(async (data, context) => {
  const { buyerName, buyerWA, paket, harga, stbId, produkId } = data;

  if (!buyerName || !buyerWA || !paket || !harga || !stbId || !produkId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required purchase data.');
  }

  // IMPORTANT: Get the Fonnte API token from environment configuration
  const fonnteToken = functions.config().fonnte.token;
  const adminWhatsappNumber = '6282272339956'; // Admin's WhatsApp number

  const msgBuyer = `Hai ${buyerName}, berikut detail pesanan kamu di *DWNStore*:\n
📦 *Paket*  : ${paket}\n
💰 *Harga*  : ${harga}\n
📺 *STBID*  : ${stbId}\n
⏳ *Status* : Pending\n
Silakan tunggu konfirmasi dari Admin. Terima kasih sudah order di DWNStore!`;

  const msgAdmin = `Halo Admin,\nAda pesanan baru:\n
👤 *Nama*   : ${buyerName}\n
📦 *Paket*  : ${paket}\n
📞 *No WA*  : ${buyerWA}\n
💰 *Harga*  : ${harga}\n
📺 *STBID*  : ${stbId}\n
Segera di proses ya!`;

  const fonnteApiUrl = 'https://api.fonnte.com/send';

  try {
    // 1. Send message to the buyer
    await fetch(fonnteApiUrl, {
      method: 'POST',
      headers: { 'Authorization': fonnteToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: buyerWA, message: msgBuyer, countryCode: '62' })
    });

    // 2. Send message to the admin
    await fetch(fonnteApiUrl, {
      method: 'POST',
      headers: { 'Authorization': fonnteToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: adminWhatsappNumber, message: msgAdmin, countryCode: '62' })
    });

    // 3. Save the purchase data to Firebase
    const newBuyerRef = db.ref('buyer').push();
    await newBuyerRef.set({
      idbuyer: newBuyerRef.key,
      nama: buyerName,
      wa: buyerWA,
      paket: paket,
      harga: harga,
      stbId: stbId,
      produkId: produkId,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });

    return { success: true, message: 'Pesanan berhasil diproses!' };

  } catch (error) {
    console.error('Error processing purchase:', error);
    throw new functions.https.HttpsError('internal', 'Gagal memproses pesanan.');
  }
});
