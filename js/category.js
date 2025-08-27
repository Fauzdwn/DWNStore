function renderCategoryProducts() {
  // Determine category from page title, e.g., "DWNStore - Kvision" -> "k-vision"
  const title = document.title.toLowerCase();
  let category = '';
  if (title.includes('kvision')) {
    category = 'k-vision';
  } else if (title.includes('nex')) {
    category = 'nex parabola';
  } else if (title.includes('nusantara')) {
    category = 'nusantara';
  }

  if (!category) {
    console.error('Could not determine category from page title.');
    return;
  }

  const container = document.getElementById('produk-container');
  if (!container) {
    console.error('Product container #produk-container not found.');
    return;
  }
  container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

  db.ref('produk').orderByChild('status').equalTo(category).once('value')
    .then(snapshot => {
      container.innerHTML = ''; // Clear spinner
      if (!snapshot.exists()) {
        container.innerHTML = `<p class="text-center">Tidak ada produk dalam kategori ini.</p>`;
        return;
      }

      snapshot.forEach(child => {
        const d = child.val();
        // Calculate the lowest price
        let minPrice = Infinity;
        if (Array.isArray(d.variations) && d.variations.length) {
          minPrice = d.variations
            .map(v => parseInt(v.price.replace(/[^0-9]/g, ''), 10))
            .reduce((a, b) => Math.min(a, b), Infinity);
        }
        const priceText = (minPrice !== Infinity)
          ? 'Rp.' + minPrice.toLocaleString()
          : '-';

        const cardHTML = `
          <div class="col-md-4 col-6 mb-4">
            <div class="product-card h-100">
              <img src="${d.urlgambar}" class="product-image" alt="${d.nama}" loading="lazy">
              <div class="product-info">
                <div>
                  <h5>${d.nama}</h5>
                  <p class="price fw-bold">${priceText}</p>
                </div>
                <a href="../beli/index.html?id=${child.key}" class="btn btn-sm btn-primary mt-2">Beli</a>
              </div>
            </div>
          </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
      });
    })
    .catch(err => {
      console.error(`Gagal memuat produk ${category}:`, err);
      container.innerHTML = `<p class="text-center text-danger">Gagal memuat produk. Silakan coba lagi.</p>`;
    });
}

document.addEventListener('DOMContentLoaded', renderCategoryProducts);
