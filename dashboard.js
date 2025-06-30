import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCzJLBy4fu8fIh0WmnjC9dKG_m1t-wI-Oc",
    authDomain: "bizventory-9c36a.firebaseapp.com",
    projectId: "bizventory-9c36a",
    storageBucket: "bizventory-9c36a.appspot.com",
    messagingSenderId: "741369398731",
    appId: "1:741369398731:web:0abb56947e39d76bbb224e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// ✅ Navigation Click Event (Unchanged)
function setupNavigationTabs() {
    document.querySelectorAll(".navList").forEach(function (element) {
        element.addEventListener("click", function () {
            document.querySelectorAll(".navList").forEach(e => e.classList.remove("active"));
            this.classList.add("active");

            const index = Array.from(this.parentNode.children).indexOf(this);
            document.querySelectorAll(".data-table").forEach(table => table.style.display = "none");

            const tables = document.querySelectorAll(".data-table");
            if (tables.length > index) {
                tables[index].style.display = "block";
            }
        });
    });
}

// ✅ Close popup globally
window.closePopup = function () {
    const popup = document.querySelector(".transaction-popup");
    if (popup) {
        popup.remove();
    }
};

// ✅ Retrieve Cart from Local Storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(productId, productName, price, quantity = 1) {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ id: productId, name: productName, price, quantity });
    }
    saveCart();
    updateCart();
}

function updateCart() {
    const cartContainer = document.querySelector(".cart-container");
    let totalPrice = 0;
    cartContainer.innerHTML = "";

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;

        const cartBox = document.createElement("div");
        cartBox.classList.add("cart-box");
        cartBox.dataset.itemId = item.id;
        cartBox.innerHTML = `
            <img src="placeholder.png" alt="${item.name}">
            <p>${item.name} - ₱${item.price.toFixed(2)} (x${item.quantity})</p>
            <button>Remove</button>
        `;
        cartContainer.appendChild(cartBox);
    });

    document.getElementById("total").textContent = totalPrice.toFixed(2);
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCart();
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

window.filterProducts = function () {
    const searchQuery = document.getElementById("search").value.toLowerCase();
    document.querySelectorAll(".product-box").forEach(product => {
        const productName = product.querySelector("p").textContent.toLowerCase();
        product.style.display = productName.includes(searchQuery) ? "block" : "none";
    });
};

function enableScroll(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.addEventListener("wheel", (event) => {
        event.preventDefault();
        container.scrollTop += event.deltaY;
    });

    let isDragging = false;
    let startY, scrollTop;

    container.addEventListener("mousedown", (event) => {
        isDragging = true;
        startY = event.pageY - container.offsetTop;
        scrollTop = container.scrollTop;
    });

    ["mouseleave", "mouseup"].forEach(e => {
        container.addEventListener(e, () => isDragging = false);
    });

    container.addEventListener("mousemove", (event) => {
        if (!isDragging) return;
        event.preventDefault();
        const y = event.pageY - container.offsetTop;
        const walk = (y - startY) * 2;
        container.scrollTop = scrollTop - walk;
    });
}

// ✅ Setup everything after DOM loads
document.addEventListener("DOMContentLoaded", () => {
    setupNavigationTabs();
    enableScroll(".products-container");
    enableScroll(".cart-container");
    updateCart();

    const cartContainer = document.querySelector(".cart-container");
    cartContainer.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON" && event.target.textContent === "Remove") {
            const itemId = event.target.closest(".cart-box").dataset.itemId;
            removeFromCart(itemId);
        }
    });

    const productsContainer = document.querySelector(".products-container");
    productsContainer.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON" && event.target.textContent === "Add to Cart") {
            const productBox = event.target.closest(".product-box");
            const productId = productBox.dataset.productId;
            const productName = productBox.querySelector("p").textContent.split(" - ")[0];
            const price = parseFloat(productBox.querySelector("p").textContent.split("₱")[1]);
            addToCart(productId, productName, price, 1);
        }
    });
});
