// Render products dengan harga termurah
function renderProducts() {
  db.ref('produk').once('value').then(snapshot => {
    const secs = {
      populer: 'produk-populer',
      'k-vision': 'produk-kvision',
      nusantara: 'produk-nusantara',
      'nex parabola': 'produk-nex'
    };
    // Clear each section
    Object.values(secs).forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        section.innerHTML = '';
      }
    });

    snapshot.forEach(child => {
      const d = child.val();
      // Hitung harga termurah dari array variations
      let minPrice = 0;
      if (Array.isArray(d.variations) && d.variations.length > 0) {
        minPrice = d.variations
          .map(v => parseInt(v.price.replace(/[^0-9]/g, ''), 10))
          .reduce((a, b) => Math.min(a, b));
      }
      const priceText = minPrice ? 'Rp.' + minPrice.toLocaleString() : '-';

      const col = `
<div class="product-card">
  ${d.status.toLowerCase() === 'populer' ? '<div class="product-label">Terlaris</div>' : ''}
  <img src="${d.urlgambar}" class="product-image" alt="${d.nama}" loading="lazy">
  <div class="product-info p-2 d-flex flex-column justify-content-between">
    <div>
      <h5>${d.nama}</h5>
      <p class="price fw-bold">${priceText}</p>
    </div>
    <a href="beli/index.html?id=${child.key}" class="btn btn-sm btn-primary mt-2">Beli</a>
  </div>
</div>
`;

      const sectionId = secs[d.status.toLowerCase()] || secs.populer;
      const section = document.getElementById(sectionId);
      if (section) {
        section.innerHTML += col;
      }
    });
  }).catch(err => console.error('Gagal load produk:', err));
}

document.addEventListener('DOMContentLoaded', renderProducts);
