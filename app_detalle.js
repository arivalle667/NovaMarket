const API_URL = 'http://localhost:4000';

document.addEventListener('DOMContentLoaded', async () => {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const cartCounter = document.getElementById('cart-count');
  if (cartCounter) {
    const totalItems = carrito.reduce((acc, item) => acc + item.quantity, 0);
    cartCounter.textContent = totalItems;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const idProducto = urlParams.get('id');

  const contenedor = document.getElementById('detalle-producto');
  if (!contenedor) {
    console.error('No se encontró el contenedor para mostrar el producto.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/productos/${idProducto}`);
    if (!res.ok) throw new Error('Producto no encontrado');

    const producto = await res.json();

    const finalPrice = producto.discount_price || producto.price;
    const priceHTML = producto.discount_price
      ? `<span style="text-decoration: line-through;">Bs ${producto.price}</span>
         <span style="color: red; font-weight: bold;"> Bs ${producto.discount_price}</span>`
      : `<span>Bs ${producto.price}</span>`;

    contenedor.innerHTML = `
      <img src="${producto.image_url1}" alt="${producto.name}" style="width: 100%; max-width: 300px; border-radius: 8px;">
      <h2>${producto.name}</h2>
      <p>${producto.description}</p>
      <p><strong>Precio: ${priceHTML}</strong></p>
      <label for="quantity">Cantidad:</label>
      <input type="number" id="quantity" value="1" min="1" style="width: 60px;">
      <button id="btn-agregar">Añadir al carrito</button>
    `;

    document.getElementById('btn-agregar').addEventListener('click', () => {
    const cantidad = parseInt(document.getElementById('quantity').value) || 1;
    if (cantidad <= 0 || isNaN(cantidad)) {
      alert("Por favor, ingresa una cantidad válida.");
      return;
    }

    const idProducto = String(producto.id); // aseguramos que siempre sea string
    const index = carrito.findIndex(item => item.id === idProducto);

    if (index !== -1) {
      carrito[index].quantity += cantidad;
    } else {
      carrito.push({
        id: idProducto,
        nombre: producto.name,
        precio: Number(finalPrice), // asegurar que precio sea número
        quantity: cantidad
      });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));

    const totalItems = carrito.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCounter) cartCounter.textContent = totalItems;
  });


  } catch (error) {
    console.error('Error al cargar producto:', error);
    contenedor.innerHTML = '<p>Error al cargar el producto.</p>';
  }

});
