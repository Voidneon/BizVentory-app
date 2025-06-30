import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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




function closePopup() {
    const popup = document.querySelector(".transaction-popup");
    if (popup) {
        popup.remove();
}
}

// ✅ Retrieve Cart from Local Storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Function to add a product to the cart
function addToCart(productId, productName, price, quantity = 1) {
    // Check if the product is already in the cart
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity; // Increase quantity if already in cart
    } else {
        // Add new item to the cart
        cart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: quantity
        });
    }
    saveCart();
    updateCart();
}

// Function to update cart display
function updateCart() {
    let cartContainer = document.querySelector(".cart-container");
    let totalPrice = 0;

    cartContainer.innerHTML = ""; // Clear previous cart display

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;

        let cartBox = document.createElement("div");
        cartBox.classList.add("cart-box");
        cartBox.dataset.itemId = item.id; // Add item ID as a data attribute

        cartBox.innerHTML = `
            <img src="placeholder.png" alt="${item.name}">
            <p>${item.name} - ₱${item.price.toFixed(2)} (x${item.quantity})</p>
            <button>Remove</button>
        `;

        cartContainer.appendChild(cartBox);
    });

    document.getElementById("total").textContent = totalPrice.toFixed(2);
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

// Make filterProducts globally accessible
window.filterProducts = function () {
    let searchQuery = document.getElementById("search").value.toLowerCase();
    let products = document.querySelectorAll(".product-box");

    products.forEach(product => {
        let productName = product.querySelector("p").textContent.toLowerCase();
        product.style.display = productName.includes(searchQuery) ? "block" : "none";
    });
};

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

// Load products from Firestore
async function loadProducts(userId) {
    const productsContainer = document.querySelector(".products-container");
    productsContainer.innerHTML = ""; // Clear previous products

    try {
        const q = query(collection(db, "users", userId, "products"), orderBy("name"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productBox = document.createElement("div");
            productBox.classList.add("product-box");
            productBox.dataset.productId = doc.id; // Add product ID as a data attribute

            productBox.innerHTML = `
                <p>${product.name} - ₱${product.price.toFixed(2)} (Stock: ${product.quantity})</p>
                <button>Add to Cart</button>
            `;

            productsContainer.appendChild(productBox);
        });
    } catch (error) {
        console.error("❌ Error loading products:", error);
        alert("❌ Failed to load products.");
    }
}

// Complete purchase and update Firestore
async function completePurchase(userId) {
    try {
        // Generate a unique transaction ID and get the current date and time
        const transactionId = Date.now().toString(); // Unique transaction ID
        const transactionDate = new Date().toLocaleString(); // Current date and time

        // Prepare transaction data
        const transactionData = {
            transactionId,
            transactionDate,
            items: cart.map(item => ({
                itemId: item.id,
                itemName: item.name,
                quantity: item.quantity,
                unitPrice: item.price
            })),
            total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0) // Calculate total
        };

        // Save the transaction to Firestore
        await addDoc(collection(db, "users", userId, "transactions"), transactionData);

        // Deduct quantities from Firestore
        for (const item of cart) {
            const productRef = doc(db, "users", userId, "products", item.id);
            const productDoc = await getDoc(productRef);
            const currentQuantity = productDoc.data().quantity;

            if (currentQuantity < item.quantity) {
                alert(`❌ Not enough stock for ${item.name}.`);
                return;
            }

            await updateDoc(productRef, {
                quantity: currentQuantity - item.quantity
            });
        }

        // Clear the cart
        cart = [];
        saveCart();
        updateCart();

        alert("✅ Purchase completed successfully!");
    } catch (error) {
        console.error("❌ Error completing purchase:", error);
        alert("❌ Failed to complete purchase.");
    }
}

// Load notifications
async function loadNotifications(userId) {
    const notificationsContainer = document.getElementById("notificationsContainer");
    notificationsContainer.innerHTML = ""; // Clear existing content

    try {
        const q = query(collection(db, "users", userId, "products"));
        const querySnapshot = await getDocs(q);

        const today = new Date();
        const notifications = [];

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const expirationDate = new Date(product.expirationDate);
            const daysUntilExpiration = Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24));

            // Low Stock Notification
            if (product.quantity <= product.lowStockThreshold) {
                notifications.push({
                    type: "low-stock",
                    message: `Low stock for ${product.name}. Only ${product.quantity} left!`
                });
            }

            // Expiring Soon Notification
            if (daysUntilExpiration <= 7 && daysUntilExpiration >= 0) {
                notifications.push({
                    type: "expiring",
                    message: `${product.name} is expiring in ${daysUntilExpiration} days!`
                });
            }

            // Out of Stock Notification
            if (product.quantity === 0) {
                notifications.push({
                    type: "out-of-stock",
                    message: `${product.name} is out of stock!`
                });
            }

            // Expired Notification
            if (daysUntilExpiration < 0) {
                notifications.push({
                    type: "expired",
                    message: `${product.name} has expired!`
                });
            }
        });

        // Display notifications
        notifications.forEach(notification => {
            const notificationElement = document.createElement("div");
            notificationElement.className = `notification ${notification.type}`;
            notificationElement.textContent = notification.message;
            notificationsContainer.appendChild(notificationElement);
        });

        // Trigger popup for critical notifications
        const criticalNotifications = notifications.filter(n => n.type === "out-of-stock" || n.type === "expired");
        criticalNotifications.forEach(notification => {
            alert(notification.message); // Or use a custom popup
        });
    } catch (error) {
        console.error("❌ Error loading notifications:", error);
        alert("❌ Failed to load notifications.");
    }
}

// Enable scroll for both sections after DOM loads
document.addEventListener("DOMContentLoaded", () => {
    enableScroll(".products-container");
    enableScroll(".cart-container");
    updateCart(); // Ensure the cart is loaded from storage when the page refreshes

    const cartContainer = document.querySelector(".cart-container");

    // Event delegation for "Remove" buttons
    cartContainer.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON" && event.target.textContent === "Remove") {
            const itemId = event.target.closest(".cart-box").dataset.itemId;
            removeFromCart(itemId);
        }
    });

    const productsContainer = document.querySelector(".products-container");

    // Event delegation for "Add to Cart" buttons
    productsContainer.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON" && event.target.textContent === "Add to Cart") {
            const productBox = event.target.closest(".product-box");
            const productId = productBox.dataset.productId;
            const productName = productBox.querySelector("p").textContent.split(" - ")[0];
            const price = parseFloat(productBox.querySelector("p").textContent.split("₱")[1]);

            addToCart(productId, productName, price, 1);
        }
    });

    // Load products and notifications for the logged-in user
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadProducts(user.uid);
            loadNotifications(user.uid);
            loadProductsForAnalytics(user.uid);
            loadTransactions(user.uid);
            loadRecentProducts(user.uid);
            loadDashboardCounts(user.uid); 
        } else {
            alert("⚠ You are not logged in!");
            window.location.href = "login.html";
        }
    });
    
    // Add a button to complete the purchase
    const purchaseButton = document.createElement("button");
    purchaseButton.textContent = "Complete Purchase";
    purchaseButton.addEventListener("click", () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                completePurchase(user.uid);
            } else {
                alert("⚠ You are not logged in!");
            }
        });
    });

    document.querySelector(".cart-section").appendChild(purchaseButton);
});

async function loadProductsForAnalytics(userId) {
    try {
        const q = query(collection(db, "users", userId, "products"));
        const querySnapshot = await getDocs(q);

        const products = [];
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            products.push(product);
        });

        // Render charts
        renderCategoryPieChart(products);
        renderQuantityBarChart(products);
        renderExpiryLineChart(products);
    } catch (error) {
        console.error("❌ Error loading products for analytics:", error);
        alert("❌ Failed to load products for analytics.");
    }
}

function renderCategoryPieChart(products) {
    const categoryCounts = {};

    // Count products by category
    products.forEach(product => {
        if (categoryCounts[product.category]) {
            categoryCounts[product.category]++;
        } else {
            categoryCounts[product.category] = 1;
        }
    });

    const ctx = document.getElementById("categoryPieChart").getContext("2d");
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(categoryCounts),
            datasets: [{
                label: "Products by Category",
                data: Object.values(categoryCounts),
                backgroundColor: [
                    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Product Categories"
                }
            }
        }
    });
}

function renderQuantityBarChart(products) {
    const productNames = products.map(product => product.name);
    const productQuantities = products.map(product => product.quantity);

    const ctx = document.getElementById("quantityBarChart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: productNames,
            datasets: [{
                label: "Product Quantities",
                data: productQuantities,
                backgroundColor: "#36A2EB",
                borderColor: "#36A2EB",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Product Quantities"
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderExpiryLineChart(products) {
    const today = new Date();
    const expiryData = products.map(product => {
        const expiryDate = new Date(product.expirationDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry;
    });

    const ctx = document.getElementById("expiryLineChart").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: products.map(product => product.name),
            datasets: [{
                label: "Days Until Expiry",
                data: expiryData,
                backgroundColor: "#4BC0C0",
                borderColor: "#4BC0C0",
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Product Expiry"
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function loadTransactions(userId) {
    const transactionsContainer = document.querySelector(".userDetailsTable > .transactions-table");
    transactionsContainer.innerHTML = ""; // Clear previous content

    try {
        const q = query(collection(db, "users", userId, "transactions"), orderBy("transactionDate", "desc"));
        const querySnapshot = await getDocs(q);

        const table = document.createElement("table");
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Transaction ID</th>
                    <th>Date and Time</th>
                    <th>Total Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${querySnapshot.docs.map(doc => {
                    const transaction = doc.data();
                    return `
                        <tr>
                            <td>${transaction.transactionId}</td>
                            <td>${transaction.transactionDate}</td>
                            <td>₱${transaction.total.toFixed(2)}</td>
                            <td class="actions">
                                <button class="btn-view" onclick="showTransactionDetails('${userId}', '${doc.id}')">View Details</button>
                            </td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        `;

        transactionsContainer.appendChild(table);
    } catch (error) {
        console.error("❌ Error loading transactions:", error);
        alert("❌ Failed to load transactions.");
    }
}

// Make showTransactionDetails globally accessible
window.showTransactionDetails = async function (userId, transactionId) {
    try {
        const transactionDoc = await getDoc(doc(db, "users", userId, "transactions", transactionId));
        const transaction = transactionDoc.data();

        const popup = document.createElement("div");
        popup.className = "transaction-popup active"; // Add 'active' class
        popup.innerHTML = `
            <div class="popup-content">
                <h2>Transaction Details</h2>
                <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
                <p><strong>Date and Time:</strong> ${transaction.transactionDate}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Item ID</th>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transaction.items.map(item => `
                            <tr>
                                <td>${item.itemId}</td>
                                <td>${item.itemName}</td>
                                <td>${item.quantity}</td>
                                <td>₱${item.unitPrice.toFixed(2)}</td>
                                <td>₱${(item.unitPrice * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                <p><strong>Total Amount:</strong> ₱${transaction.total.toFixed(2)}</p>
                <button onclick="closePopup()">Close</button>
            </div>
        `;

        document.body.appendChild(popup);
    } catch (error) {
        console.error("❌ Error fetching transaction details:", error);
        alert("❌ Failed to fetch transaction details.");
    }
};

async function loadRecentProducts(userId) {
    const recentProductsBody = document.getElementById("recentProductsBody");
    recentProductsBody.innerHTML = ""; // Clear existing content

    try {
        const q = query(collection(db, "users", userId, "products"), orderBy("date", "desc"), limit(5));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>₱${product.price.toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td class="actions">
                    <button class="btn-edit"><ion-icon name="create-outline"></ion-icon></button>
                    <button class="btn-delete"><ion-icon name="trash-outline"></ion-icon></button>
                </td>
            `;

            recentProductsBody.appendChild(row);
        });
    } catch (error) {
        console.error("❌ Error loading recent products:", error);
        alert("❌ Failed to load recent products.");
    }
}

window.closePopup = function () {
    const popup = document.querySelector(".transaction-popup");
    if (popup) {
        popup.remove(); // Remove the popup from the DOM
    }
};

async function loadDashboardCounts(userId) {
    try{
                const productsSnapshot = await getDocs(collection(db, "users", userId, "products"));
        const transactionsSnapshot = await getDocs(collection(db, "users", userId, "transactions"));

        
        document.getElementById("inventoryCount").textContent = productsSnapshot.size;

        
        document.getElementById("transactionCount").textContent = transactionsSnapshot.size;

        
        const today = new Date();
        const todayString = today.toLocaleDateString(); 

        let todayCount = 0;
        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            if (transaction.transactionDate?.includes(todayString)) {
                todayCount++;
            }
        });

        document.getElementById("todayTransactionCount").textContent = todayCount;
    }
    
    catch (error){
        console.error("Error Loading Dashboard count:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.querySelector("#logout");
    const profileName = document.querySelector('.profile .links'); // Target Profile Name

    async function typeWriter(text, element) {
        element.textContent = "";
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, 100)); // Delay per letter
        }
    }
});

