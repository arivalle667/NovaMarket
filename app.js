// app.js - Versión unificada, corregida y modularizada

const API_URL = 'http://localhost:4000';
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Evento principal DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadCategories();
  loadDiscountedProducts();
  actualizarContador();
  renderCart();
  setupEventListeners();
});

function actualizarContador() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const totalItems = carrito.reduce((acc, item) => {
    const cantidad = parseInt(item.quantity);
    return acc + (isNaN(cantidad) ? 0 : cantidad);
  }, 0);

  const cartCounter = document.getElementById('cart-count');
  if (cartCounter) cartCounter.textContent = totalItems;
}


async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/categorias`);
    const categories = await res.json();
    const container = document.getElementById('categorias');
    let html = `<h2>Categorías</h2><div class="categorias">`;
    categories.forEach(cat => {
      html += `
        <div class="categoria" onclick="window.location.href='categorias.html?id=${cat.id}&name=${encodeURIComponent(cat.name)}'">
          <img src="${cat.image_url}" alt="${cat.name}">
          <h3>${cat.name}</h3>
        </div>
      `;
    });
    container.innerHTML = html + '</div>';
  } catch (err) {
    console.error('Error cargando categorías:', err);
    document.getElementById('categorias').innerHTML = '<p>Error al cargar las categorías.</p>';
  }
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/productos`);
    const products = await res.json();
    const container = document.getElementById('productos');

    let html = `<h2>Productos</h2><div class="products">`;
    products.forEach(product => {
      const finalPrice = product.discount_price || product.price;
      const priceHTML = product.discount_price
        ? `<span style="text-decoration: line-through;">Bs ${product.price}</span> <span style="color: red; font-weight: bold;"> Bs ${product.discount_price}</span>`
        : `<span>Bs ${product.price}</span>`;

      html += `
        <div class="product" data-id="${product.id}" style="cursor: pointer;">
          <span><b>${product.name}</b><br>Precio: ${priceHTML}</span>
          ${renderCarousel(product, product.id)}
          <label for="quantity-${product.id}">Cantidad:</label>
          <input type="number" id="quantity-${product.id}" min="1" value="1">
          <button class="add-to-cart" data-id="${product.id}" data-nombre="${product.name}" data-precio="${finalPrice}">Agregar al carrito</button>
        </div>
      `;
    });
    container.innerHTML = html + '</div>';

    document.querySelectorAll('.product').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        const id = el.getAttribute('data-id');
        window.location.href = `detalle.html?id=${id}`;
      });
    });
  } catch (err) {
    console.error('Error cargando productos:', err);
    document.getElementById('productos').innerHTML = '<p>Error al cargar los productos.</p>';
  }
}

async function loadDiscountedProducts() {
  try {
    const res = await fetch(`${API_URL}/productos`);
    const products = await res.json();
    const ofertas = products.filter(p => p.discount_price !== null);
    const container = document.getElementById('ofertas');

    if (ofertas.length === 0) {
      container.innerHTML = '<p>No hay productos en oferta actualmente.</p>';
      return;
    }

    let html = `<h2>🔥 Ofertas</h2><div class="products">`;
    ofertas.forEach(product => {
      html += `
        <div class="product" data-id="${product.id}">
          <span><b>${product.name}</b><br>Precio: <span style="text-decoration: line-through;">Bs ${product.price}</span> <span style="color: red; font-weight: bold;">Bs ${product.discount_price}</span></span>
          ${renderCarousel(product, `oferta-${product.id}`)}
          <label for="quantity-${product.id}">Cantidad:</label>
          <input type="number" id="quantity-${product.id}" min="1" value="1">
          <button class="add-to-cart" data-id="${product.id}" data-nombre="${product.name}" data-precio="${product.discount_price}">Agregar al carrito</button>
        </div>
      `;
    });

    container.innerHTML = html + '</div>';

    document.querySelectorAll('.product').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        const id = el.getAttribute('data-id');
        window.location.href = `detalle.html?id=${id}`;
      });
    });
  } catch (err) {
    console.error('Error cargando ofertas:', err);
    document.getElementById('ofertas').innerHTML = '<p>Error al cargar las ofertas.</p>';
  }
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
      renderCart();
    }

    if (e.target.matches('.remove-btn')) {
      const index = parseInt(e.target.dataset.index);
      carrito.splice(index, 1);
      localStorage.setItem('carrito', JSON.stringify(carrito));
      actualizarContador();
      renderCart();
    }
  });

  const btnVaciar = document.getElementById('vaciar-carrito');
  if (btnVaciar) {
    btnVaciar.addEventListener('click', () => {
      carrito = [];
      localStorage.removeItem('carrito');
      actualizarContador();
      renderCart();

      // Resetear inputs de cantidad
      document.querySelectorAll('input[type="number"][id^="quantity-"]').forEach(input => {
        input.value = 1;
      });

      alert('Carrito vaciado exitosamente.');
    });
  }
}

function renderCart() {
  const lista = document.getElementById('lista-carrito');
  const totalEl = document.getElementById('total-carrito');
  if (!lista || !totalEl) return;

  lista.innerHTML = '';

  if (carrito.length === 0) {
    lista.innerHTML = '<p>No hay productos en el carrito.</p>';
    totalEl.textContent = 'Total: Bs 0.00';
    return;
  }

  let total = 0;
  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.quantity;
    total += subtotal;

    const div = document.createElement('div');
    div.innerHTML = `
      <strong>${item.nombre}</strong> - Cantidad: ${item.quantity} - 
      Precio unitario: Bs ${Number(item.precio).toFixed(2)} -
      Subtotal: Bs ${subtotal.toFixed(2)}
      <button class="remove-btn" data-index="${index}">Eliminar</button>
    `;
    lista.appendChild(div);
  });

  totalEl.textContent = `Total: Bs ${total.toFixed(2)}`;
}

function renderCarousel(product, idPrefix) {
  // Recopilar imágenes válidas
  const images = [];
  if (product.image_url1) images.push({ url: product.image_url1, alt: `${product.name} - Imagen 1` });
  if (product.image_url2) images.push({ url: product.image_url2, alt: `${product.name} - Imagen 2` });
  if (product.image_url3) images.push({ url: product.image_url3, alt: `${product.name} - Imagen 3` });

  if (images.length === 0) {
    return `<p>No hay imágenes disponibles.</p>`;
  }

  // Construir HTML del carrusel
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

function verProducto(id) {
  window.location.href = `detalle.html?id=${id}`;
}

//CODIGO DATOS(LUGAR, FECHA Y HORA)

// Obtener referencias a los elementos
const calendar = document.getElementById("calendar");
const time = document.getElementById("time");
const lugar = document.getElementById("lugar");
const selectedInfo = document.getElementById("selectedInfo");
const selectedInfo2 = document.getElementById("selectedInfo2");

// Configurar la fecha mínima para el calendario (mañana)
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const minDate = tomorrow.toISOString().split("T")[0];
calendar.setAttribute("min", minDate);

// Actualizar la selección de fecha, hora y lugar
function updateSelection() {
    const selectedDate = calendar.value; // Fecha seleccionada
    const selectedTime = time.value; // Hora seleccionada
    const selectedLugar = lugar.value; // Lugar seleccionado

    if (selectedDate && selectedTime) {
        selectedInfo.textContent = `Fecha(año-mes-dia) y hora: ${selectedDate} a las ${selectedTime}`;
    } else if (selectedDate) {
        selectedInfo.textContent = `Fecha seleccionada(año-mes-dia): ${selectedDate}`;
    } else if (selectedTime) {
        selectedInfo.textContent = `Hora seleccionada: ${selectedTime}`;
    } else {
        selectedInfo.textContent = "";
    }

    if (selectedLugar){
        selectedInfo2.textContent = `Lugar: ${selectedLugar}`;
    }else{
        selectedInfo2.textContent = "";
    }
}
//CODIGO CONEXION API WHATSAPP

// Comprar productos
function buyItems() {
    if (carrito.length === 0) {
    alert('El carrito está vacío.');
    return;
    }

    if (!calendar.value) {
        alert('Selecciona una fecha por favor.');
        return;
    }

    if (!time.value) {
        alert('Selecciona una hora por favor.');
        return;
    }

    if (!lugar.value) {
        alert('Selecciona el lugar de entrega por favor.');
        return;
    }

    let total = 0;
    carrito.forEach((item) => {
        total += item.precio*item.quantity;
    });

    const phoneNumber = '59178839123'; // Número de WhatsApp sin el "+"
    const message = carrito.map(item =>
      `${item.nombre} - Precio unitario: Bs ${item.precio.toFixed(2)} - Cantidad: ${item.quantity}`
    ).join('\n');

    const encodedMessage = encodeURIComponent(
      `Hola, me interesa comprar los siguientes productos:\n` +
      `${message}\n\nTotal: Bs ${total.toFixed(2)}\n` +
      `Lugar: ${lugar.value}\n` +
      `Fecha(año-mes-dia): ${calendar.value} a las ${time.value}`
    );

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
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

function toggleMenu() {
    const nav = document.getElementById('navbar');
    nav.classList.toggle('show');
}

function enviarCorreo(){
  alert("Gracias por enviarnos tu correo, recibiras noticias y ofertas muy pronto.");
}