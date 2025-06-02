const API_URL = 'http://localhost:4000'; // Cambia el puerto si es necesario
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get('id');
  const categoryName = params.get('name') || '';

  if (categoryId) {
    loadProductsByCategory(categoryId, categoryName);
  }

  actualizarContador();
  setupEventListeners();
});

async function loadProductsByCategory(categoryId, categoryName) {
  try {
    const res = await fetch(`${API_URL}/productos`);
    const allProducts = await res.json();
    const filtered = allProducts.filter(p => p.category_id == categoryId);

    const container = document.getElementById('productos-categoria');
    document.getElementById('titulo-categoria').textContent = `Productos en: ${categoryName}`;

    if (filtered.length === 0) {
      container.innerHTML = '<p>No hay productos en esta categoría.</p>';
      return;
    }

    let html = '<div class="products">';
    filtered.forEach(p => {
      const finalPrice = p.discount_price || p.price;
      html += `
        <div class="product" data-id="${p.id}" style="cursor: pointer;">
          <span><b>${p.name}</b><br>Precio: Bs ${p.discount_price ? `<s>${p.price}</s> <span style="color:red;">${p.discount_price}</span>` : p.price}</span>
          ${renderCarousel(p, p.id)}
          <label for="quantity-${p.id}">Cantidad:</label>
          <input type="number" id="quantity-${p.id}" min="1" value="1">
          <button class="add-to-cart" data-id="${p.id}" data-nombre="${p.name}" data-precio="${finalPrice}">Agregar al carrito</button>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  } catch (err) {
    console.error('Error:', err);
    document.getElementById('productos-categoria').innerHTML = '<p>Error al cargar los productos.</p>';
  }
}

function renderCarousel(product, idPrefix) {
  const images = [];
  if (product.image_url1) images.push({ url: product.image_url1, alt: `${product.name} - Imagen 1` });
  if (product.image_url2) images.push({ url: product.image_url2, alt: `${product.name} - Imagen 2` });
  if (product.image_url3) images.push({ url: product.image_url3, alt: `${product.name} - Imagen 3` });

  if (images.length === 0) {
    return `<p>No hay imágenes disponibles.</p>`;
  }

  return `
    <div class="carousel">
      <div class="carousel-images" id="carousel-${idPrefix}">
        ${images.map(img => `<img src="${img.url}" alt="${img.alt}">`).join('')}
      </div>
      <button class="carousel-arrow left" onclick="prevImage('carousel-${idPrefix}')">&#8592;</button>
      <button class="carousel-arrow right" onclick="nextImage('carousel-${idPrefix}')">&#8594;</button>
    </div>
  `;
}

//carrusel de imagenes

//carrusel codigo

function prevImage(carouselId) {
    const carousel = document.getElementById(carouselId);
    const images = carousel.querySelectorAll('img');
    const currentTransform = getComputedStyle(carousel).transform;
    const translateX = currentTransform.includes('matrix') ? parseFloat(currentTransform.split(',')[4]) : 0;
    const imageWidth = images[0].clientWidth;
    const maxTranslate = -(images.length - 1) * imageWidth;
    const newTranslate = translateX + imageWidth;

    if (newTranslate <= 0) {
        carousel.style.transform = `translateX(${newTranslate}px)`;
    } else {
        carousel.style.transform = `translateX(${maxTranslate}px)`;
    }
}

function nextImage(carouselId) {
    const carousel = document.getElementById(carouselId);
    const images = carousel.querySelectorAll('img');
    const currentTransform = getComputedStyle(carousel).transform;
    const translateX = currentTransform.includes('matrix') ? parseFloat(currentTransform.split(',')[4]) : 0;
    const imageWidth = images[0].clientWidth;
    const maxTranslate = -(images.length - 1) * imageWidth;
    const newTranslate = translateX - imageWidth;

    if (newTranslate >= maxTranslate) {
        carousel.style.transform = `translateX(${newTranslate}px)`;
    } else {
        carousel.style.transform = `translateX(0px)`;
    }
}

function actualizarContador() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const totalItems = carrito.reduce((acc, item) => acc + parseInt(item.quantity || 0), 0);
  const cartCounter = document.getElementById('cart-count');
  if (cartCounter) cartCounter.textContent = totalItems;
}

function setupEventListeners() {
  document.addEventListener('click', e => {
    if (e.target.matches('.add-to-cart')) {
      const btn = e.target;
      const id = btn.dataset.id;
      const nombre = btn.dataset.nombre;
      const precio = parseFloat(btn.dataset.precio);
      const container = btn.closest('.product');
      const input = container.querySelector(`#quantity-${id}`);
      const quantity = input ? parseInt(input.value) : 1;

      if (!id || !nombre || isNaN(precio) || isNaN(quantity) || quantity <= 0) return;

      const existing = carrito.find(p => p.id === id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        carrito.push({ id, nombre, precio, quantity });
      }

      localStorage.setItem('carrito', JSON.stringify(carrito));
      actualizarContador();
      renderCart?.(); // Si tienes una función renderCart
    }

    if (e.target.matches('.remove-btn')) {
      const index = parseInt(e.target.dataset.index);
      carrito.splice(index, 1);
      localStorage.setItem('carrito', JSON.stringify(carrito));
      actualizarContador();
      renderCart?.();
    }
  });

  const btnVaciar = document.getElementById('vaciar-carrito');
  if (btnVaciar) {
    btnVaciar.addEventListener('click', () => {
      carrito = [];
      localStorage.removeItem('carrito');
      actualizarContador();
      renderCart?.();
      document.querySelectorAll('input[type="number"][id^="quantity-"]').forEach(input => input.value = 1);
      alert('Carrito vaciado exitosamente.');
    });
  }
}
