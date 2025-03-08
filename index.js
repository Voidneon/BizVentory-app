// ✅ Navigation Click Event (Unchanged)
document.querySelectorAll(".navList").forEach(function (element) {
  element.addEventListener("click", function () {
      document.querySelectorAll(".navList").forEach(e => e.classList.remove("active"));
      this.classList.add("active");

      let index = Array.from(this.parentNode.children).indexOf(this);
      document.querySelectorAll(".data-table").forEach(table => table.style.display = "none");

      let tables = document.querySelectorAll(".data-table");
      if (tables.length > index) {
          tables[index].style.display = "block";
      }
  });
});

// ✅ Retrieve Cart from Local Storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Function to add a product to the cart
function addToCart(productName, price) {
  // Create a unique entry for each item added
  let cartItem = {
      id: Date.now(), // Unique ID for each added item
      name: productName,
      price: price
  };

  cart.push(cartItem);
  saveCart();
  updateCart();
}

// Function to update cart display
function updateCart() {
  let cartContainer = document.querySelector(".cart-container");
  let totalPrice = 0;

  cartContainer.innerHTML = ""; // Clear previous cart display

  cart.forEach(item => {
      totalPrice += item.price;

      let cartBox = document.createElement("div");
      cartBox.classList.add("cart-box");

      cartBox.innerHTML = `
          <img src="placeholder.png" alt="${item.name}">
          <p>${item.name} - ₱${item.price}</p>
          <button onclick="removeFromCart(${item.id})">Remove</button>
      `;

      cartContainer.appendChild(cartBox);
  });

  document.getElementById("total").textContent = totalPrice;
}

// Function to remove an item from the cart
function removeFromCart(itemId) {
  cart = cart.filter(item => item.id !== itemId);
  saveCart();
  updateCart();
}

// Function to save cart in localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Function to filter products based on search input
function filterProducts() {
  let searchQuery = document.getElementById("search").value.toLowerCase();
  let products = document.querySelectorAll(".product-box");

  products.forEach(product => {
      let productName = product.querySelector("p").textContent.toLowerCase();
      product.style.display = productName.includes(searchQuery) ? "block" : "none";
  });
}

// ✅ Scroll Functionality for Purchase Products and Cart
function enableScroll(containerSelector) {
  const container = document.querySelector(containerSelector);

  if (container) {
      container.addEventListener("wheel", (event) => {
          event.preventDefault();
          container.scrollTop += event.deltaY; // Scroll vertically
      });

      let isDragging = false;
      let startY, scrollTop;

      container.addEventListener("mousedown", (event) => {
          isDragging = true;
          startY = event.pageY - container.offsetTop;
          scrollTop = container.scrollTop;
      });

      container.addEventListener("mouseleave", () => (isDragging = false));
      container.addEventListener("mouseup", () => (isDragging = false));

      container.addEventListener("mousemove", (event) => {
          if (!isDragging) return;
          event.preventDefault();
          let y = event.pageY - container.offsetTop;
          let walk = (y - startY) * 2; // Increase scroll speed
          container.scrollTop = scrollTop - walk;
      });
  }
}

// Enable scroll for both sections after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  enableScroll(".products-container");
  enableScroll(".cart-container");
  updateCart(); // Ensure the cart is loaded from storage when the page refreshes
});
