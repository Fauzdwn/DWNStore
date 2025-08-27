// Helper: buat element variation baru
function newVariation(name = '', price = '') {
  const div = document.createElement('div');
  div.className = 'variation-item input-group mb-2';
  div.innerHTML = `
    <input type="text" class="form-control var-name" placeholder="Nama Paket" value="${name}" required>
    <input type="number" class="form-control var-price" placeholder="Harga (e.g. 20000)" value="${price}" required>
    <button type="button" class="btn btn-outline-danger remove-variation">×</button>
  `;
  div.querySelector('.remove-variation').onclick = () => div.remove();
  return div;
}

// Tambah variation on-click
document.getElementById('add-variation').onclick = () => {
  document.getElementById('variations-container').appendChild(newVariation());
};

// Login via Realtime DB (node 'acount')
document.getElementById('login-btn').onclick = () => {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();
  if (!user || !pass) {
    return alert('Isi username & password!');
  }
  db.ref('acount').once('value')
    .then(snap => {
      const acc = snap.val() || {};
      if (user === acc.username && pass === acc.password) {
        sessionStorage.setItem('isAdmin', 'true');
        showAdmin();
      } else {
        alert('Username atau password salah');
      }
    })
    .catch(err => alert('Error saat login: ' + err.message));
};

// Logout
document.getElementById('logout-btn').onclick = () => {
  sessionStorage.removeItem('isAdmin');
  location.reload();
};

// Tampilkan panel admin dan siapkan form
function showAdmin() {
  document.getElementById('login-form').classList.add('d-none');
  document.getElementById('admin-panel').classList.remove('d-none');
  // Pastikan ada satu variation default
  const vc = document.getElementById('variations-container');
  vc.innerHTML = '';
  vc.appendChild(newVariation());
  loadAdminTable();
}
if (sessionStorage.getItem('isAdmin') === 'true') {
  showAdmin();
}

// Load data produk ke tabel secara realtime
function loadAdminTable() {
  const tbody = document.querySelector('#admin-table tbody');
  db.ref('produk').on('value', snap => {
    tbody.innerHTML = '';
    if (!snap.exists()) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada produk</td></tr>';
      return;
    }
    snap.forEach(child => {
      const d = child.val();
      // hitung harga termurah
      const prices = Array.isArray(d.variations)
        ? d.variations.map(v => parseInt(v.price.replace(/[^0-9]/g,''), 10))
        : [];
      const minPrice = prices.length ? Math.min(...prices) : 0;
      tbody.innerHTML += `
        <tr>
          <td>${d.id}</td>
          <td>${d.nama}</td>
          <td>${(d.deskripsi || '').replace(/\n/g, '<br>')}</td>
          <td>Rp.${minPrice.toLocaleString()}</td>
          <td>${d.status}</td>
          <td>
            <button class="btn btn-sm btn-warning me-2" onclick="edit('${child.key}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="hapus('${child.key}')">Hapus</button>
          </td>
        </tr>`;
    });
  }, err => {
    console.error('Gagal memuat produk:', err);
    alert('Gagal memuat data produk: ' + err.message);
  });
}

// Create & Update produk
document.getElementById('product-form').onsubmit = e => {
  e.preventDefault();
  const keyField = document.getElementById('prod-key').value;
  const isNew = !keyField;
  const idValue = isNew ? Date.now() : Number(document.getElementById('prod-id').value);
  const nama = document.getElementById('prod-name').value.trim();
  const deskripsi = document.getElementById('prod-desk').value.trim()
  const status = document.getElementById('prod-status').value;
  const urlgambar = document.getElementById('prod-image').value.trim();

  // kumpulkan variations
  const variations = [];
  document.querySelectorAll('.variation-item').forEach(el => {
    const nm = el.querySelector('.var-name').value.trim();
    const pr = el.querySelector('.var-price').value.trim();
    if (nm && pr) variations.push({ name: nm, price: pr });
  });
  if (variations.length === 0) {
    return alert('Tambahkan minimal satu paket/variasi!');
  }

  const data = { id: idValue, nama, deskripsi, status, urlgambar, variations };
  const ref = isNew ? db.ref('produk').push() : db.ref('produk/' + keyField);
  ref.set(data)
    .then(() => {
      // reset form
      e.target.reset();
      document.getElementById('prod-key').value = '';
      document.getElementById('prod-id').value = '';
      const vc = document.getElementById('variations-container');
      vc.innerHTML = '';
      vc.appendChild(newVariation());
      // scroll ke tabel
      document.getElementById('admin-table').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => alert('Gagal simpan produk: ' + err.message));
};

// Edit produk: isi form dengan data yang ada
function edit(key) {
  db.ref('produk/' + key).once('value')
    .then(snap => {
      const d = snap.val();
      document.getElementById('prod-key').value = key;
      document.getElementById('prod-id').value = d.id;
      document.getElementById('prod-name').value = d.nama;
      document.getElementById('prod-desk').value = d.deskripsi;
      document.getElementById('prod-image').value = d.urlgambar;
      document.getElementById('prod-status').value = d.status;
      // muat variations
      const vc = document.getElementById('variations-container');
      vc.innerHTML = '';
      if (Array.isArray(d.variations)) {
        d.variations.forEach(v => vc.appendChild(newVariation(v.name, v.price)));
      } else {
        vc.appendChild(newVariation());
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    .catch(err => alert('Gagal load data produk: ' + err.message));
}

// Hapus produk
function hapus(key) {
  if (confirm('Hapus produk ini?')) {
    db.ref('produk/' + key).remove()
      .catch(err => alert('Gagal hapus produk: ' + err.message));
  }
}
