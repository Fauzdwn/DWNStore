const params = new URLSearchParams(location.search);
const key = params.get('id');

function formHTML(variations) {
  const options = variations.map(v => `<option value="${v.name}">${v.name} - Rp.${parseInt(v.price).toLocaleString()}</option>`).join('');
  return `
    <div class="form-container">
      <h4 class="mb-3 text-center">Form Pemesanan Paket</h4>

      <div id="successAlert" class="alert alert-success" role="alert">
        Pesanan sedang di proses! Silakan tunggu konfirmasi di WhatsApp.
      </div>

      <div class="mb-3">
        <label for="buyerName" class="form-label">Nama Anda</label>
        <input type="text" class="form-control" id="buyerName" placeholder="Nama" required>
      </div>

      <div class="mb-3">
        <label for="buyerWA" class="form-label">Nomor WhatsApp</label>
        <input type="tel" class="form-control" id="buyerWA" placeholder="0822xxxxxxxx" required>
      </div>

      <div class="mb-3">
        <label for="paket" class="form-label">Pilih Paket</label>
        <select class="form-select" id="paket" required>
          <option value="">-- Pilih Paket --</option>
          ${options}
        </select>
      </div>

      <div class="mb-3">
        <label for="hargaPaket" class="form-label">Harga</label>
        <input type="text" class="form-control" id="hargaPaket" readonly required>
      </div>

      <div class="mb-3">
        <label for="stbId" class="form-label">STBID / No. Pelanggan</label>
        <input type="text" class="form-control" id="stbId" placeholder="Masukkan STBID / No. Pelanggan" required>
      </div>

      <button id="btnBeli" class="btn btn-primary w-100">Beli Sekarang</button>

      <div id="loadingSpinner" class="text-center mt-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Mengirim pesanan...</p>
      </div>
    </div>`;
}

if (key) {
  db.ref('produk/' + key).once('value').then(snap => {
    if (!snap.exists()) {
      document.getElementById('produk-detail').innerHTML = `<p class="text-center">Produk tidak ditemukan.</p>`;
      return;
    }
    const d = snap.val();
    document.getElementById('produk-detail').innerHTML = `
      <h3>${d.nama}</h3>
      <img src="${d.urlgambar}" alt="${d.nama}" class="product-img mb-3">
      <div id="deskripsi" class="mb-1 desc-clamp">
        ${d.deskripsi}
      </div>
      <span id="toggleDesc" class="toggle-desc">Baca selengkapnya…</span>
      <hr />
      ${formHTML(d.variations)}`;

    const descDiv = document.getElementById('deskripsi');
    const toggleLink = document.getElementById('toggleDesc');

    // Hide toggle if description is not long enough to be clamped
    if (descDiv.scrollHeight <= descDiv.clientHeight) {
        toggleLink.style.display = 'none';
    }

    toggleLink.addEventListener('click', () => {
      const isExpanded = descDiv.classList.toggle('expanded');
      toggleLink.textContent = isExpanded ? 'Tutup ringkasan' : 'Baca selengkapnya…';
    });

    const buyerName = document.getElementById('buyerName');
    const buyerWA = document.getElementById('buyerWA');
    const paketSelect = document.getElementById('paket');
    const hargaInput = document.getElementById('hargaPaket');
    const stbInput = document.getElementById('stbId');
    const btn = document.getElementById('btnBeli');
    const spinner = document.getElementById('loadingSpinner');
    const alertBox = document.getElementById('successAlert');

    alertBox.style.display = 'none';
    spinner.style.display = 'none';

    paketSelect.addEventListener('change', () => {
      const selectedVariationName = paketSelect.value;
      const selectedVariation = d.variations.find(v => v.name === selectedVariationName);
      hargaInput.value = selectedVariation ? `Rp.${parseInt(selectedVariation.price).toLocaleString()}` : '';
    });

    btn.addEventListener('click', async () => {
      if (!buyerName.value || !buyerWA.value || !paketSelect.value || !hargaInput.value || !stbInput.value) {
        return alert('Semua kolom wajib diisi!');
      }
      btn.disabled = true;
      spinner.style.display = 'block';

      const msgBuyer = `Hai ${buyerName.value}, berikut detail pesanan kamu di *DWNStore*:\n
📦 *Paket*  : ${paketSelect.value}\n
💰 *Harga*  : ${hargaInput.value}\n
📺 *STBID*  : ${stbInput.value}\n
⏳ *Status* : Pending\n
Silakan tunggu konfirmasi dari Admin. Terima kasih sudah order di DWNStore!`;

      const msgAdmin = `Halo Admin,\nAda pesanan baru:\n
👤 *Nama*   : ${buyerName.value}\n
📦 *Paket*  : ${paketSelect.value}\n
📞 *No WA*  : ${buyerWA.value}\n
💰 *Harga*  : ${hargaInput.value}\n
📺 *STBID*  : ${stbInput.value}\n
Segera di proses ya!`;

      const formBuyer = new FormData();
      formBuyer.append('target', buyerWA.value);
      formBuyer.append('message', msgBuyer);
      formBuyer.append('countryCode', '62');
      formBuyer.append('delay', '2');

      const formAdmin = new FormData();
      formAdmin.append('target', '6282272339956'); // Admin number
      formAdmin.append('message', msgAdmin);
      formAdmin.append('countryCode', '62');
      formAdmin.append('delay', '2');

      try {
        // Using the token from js/api-keys.js
        const headers = { 'Authorization': FONNTE_API_TOKEN };

        // Send to buyer
        await fetch('https://api.fonnte.com/send', {
          method: 'POST', headers: headers, body: formBuyer
        });
        // Send to admin
        await fetch('https://api.fonnte.com/send', {
          method: 'POST', headers: headers, body: formAdmin
        });

        // Save buyer data to Firebase
        const newBuyerRef = db.ref('buyer').push();
        await newBuyerRef.set({
          idbuyer: newBuyerRef.key,
          nama: buyerName.value,
          wa: buyerWA.value,
          paket: paketSelect.value,
          harga: hargaInput.value,
          stbId: stbInput.value,
          produkId: key,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        alertBox.style.display = 'block';
      } catch (err) {
        console.error('Gagal kirim atau simpan data:', err);
        alert('Gagal mengirim pesan atau menyimpan data!');
      } finally {
        spinner.style.display = 'none';
        btn.disabled = false;
      }
    });
  }).catch(err => {
      console.error('Gagal load detail produk:', err)
      document.getElementById('produk-detail').innerHTML = `<p class="text-center text-danger">Gagal memuat detail produk. Silakan coba lagi nanti.</p>`;
  });
}
