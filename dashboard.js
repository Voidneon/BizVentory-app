import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

/* ====================== */
/* CURRENCY FORMATTING */
/* ====================== */
function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '') return '₱0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return '₱' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

/* ====================== */
/* NOTIFICATION SYSTEM */
/* ====================== */
const MAX_NOTIFICATIONS = 3;
const NOTIFICATION_TIMEOUT = 4000;
let notificationQueue = [];
let activeNotifications = 0;

function showBubbleNotifications(notifications) {
    notificationQueue = [];
    const toShowNow = notifications.slice(0, MAX_NOTIFICATIONS);
    notificationQueue = notifications.slice(MAX_NOTIFICATIONS);
    
    toShowNow.forEach(notification => {
        createNotification(notification);
    });
}

function createNotification({type, icon, message}) {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    if (activeNotifications >= MAX_NOTIFICATIONS) {
        notificationQueue.push({type, icon, message});
        return;
    }

    activeNotifications++;
    
    const notification = document.createElement('div');
    notification.className = `notification-bubble ${type}`;
    notification.innerHTML = `
        <ion-icon name="${icon}" class="notification-icon"></ion-icon>
        <div class="notification-content">${message}</div>
        <button class="close-btn">&times;</button>
    `;
    
    container.appendChild(notification);
    void notification.offsetWidth;
    notification.classList.add('show');
    
    const autoHideTimer = setTimeout(() => {
        removeNotification(notification);
    }, NOTIFICATION_TIMEOUT);
    
    notification.querySelector('.close-btn').addEventListener('click', () => {
        clearTimeout(autoHideTimer);
        removeNotification(notification);
    });
}

function removeNotification(element) {
    element.classList.remove('show');
    element.classList.add('hide');
    setTimeout(() => {
        element.remove();
        activeNotifications--;
        showNextQueuedNotification();
    }, 300);
}

function showNextQueuedNotification() {
    if (notificationQueue.length > 0 && activeNotifications < MAX_NOTIFICATIONS) {
        const nextNotif = notificationQueue.shift();
        createNotification(nextNotif);
    }
}

window.showBubbleNotification = (type, icon, message) => {
    showBubbleNotifications([{type, icon, message}]);
};
window.showBubbleNotifications = showBubbleNotifications;

/* ====================== */
/* CART SYSTEM */
/* ====================== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updatePurchaseButton() {
    const purchaseBtn = document.getElementById("completePurchaseBtn");
    if (purchaseBtn) {
        purchaseBtn.disabled = cart.length === 0;
    }
}

function addToCart(productId, productName, price, quantity = 1) {
    if (quantity <= 0) {
        showBubbleNotification("error", "close-circle-outline", "Quantity must be at least 1");
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
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

function setCartItemQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        updateCart();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCart();
}

function updateCart() {
    let cartContainer = document.querySelector(".cart-container");
    let totalPrice = 0;

    if (!cartContainer) return;

    cartContainer.innerHTML = "";

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;

        let cartBox = document.createElement("div");
        cartBox.classList.add("cart-box");
        cartBox.dataset.itemId = item.id;

        cartBox.innerHTML = `
            <img src="placeholder.png" alt="${item.name}">
            <div class="cart-item-details">
                <p>${item.name}</p>
                <div class="cart-item-controls">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="cart-quantity" value="${item.quantity}" min="1">
                    <button class="quantity-btn plus">+</button>
                    <span class="item-price">${formatCurrency(item.price * item.quantity)}</span>
                </div>
            </div>
            <button class="remove-btn">Remove</button>
        `;

        cartContainer.appendChild(cartBox);
    });

    if (document.getElementById("total")) {
        document.getElementById("total").textContent = formatCurrency(totalPrice);
    }
    updatePurchaseButton();
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* ====================== */
/* PRODUCTS SYSTEM */
/* ====================== */
async function loadProducts(userId) {
    const productsContainer = document.querySelector(".products-container");
    if (!productsContainer) return;

    try {
        const q = query(collection(db, "users", userId, "products"), orderBy("name"));
        const querySnapshot = await getDocs(q);

        productsContainer.innerHTML = "";

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productBox = document.createElement("div");
            productBox.classList.add("product-box");
            productBox.dataset.productId = doc.id;

            productBox.innerHTML = `
                <p>${product.name} - ${formatCurrency(product.price)}</p>
                <small>Stock: ${product.quantity}</small>
                <div class="quantity-controls">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="quantity-input" value="1" min="1" max="${product.quantity}">
                    <button class="quantity-btn plus">+</button>
                    <button class="add-to-cart-btn">Add to Cart</button>
                </div>
            `;

            productsContainer.appendChild(productBox);
        });

        setupProductEventListeners();
    } catch (error) {
        console.error("Error loading products:", error);
        showBubbleNotification("error", "alert-circle-outline", "Failed to load products.");
    }
}

function setupProductEventListeners() {
    const productsContainer = document.querySelector(".products-container");
    if (!productsContainer) return;

    productsContainer.addEventListener("click", (event) => {
        const productBox = event.target.closest(".product-box");
        if (!productBox) return;

        const productId = productBox.dataset.productId;
        const productName = productBox.querySelector("p").textContent.split(" - ")[0];
        const price = parseFloat(productBox.querySelector("p").textContent.split("₱")[1]);
        const quantityInput = productBox.querySelector(".quantity-input");
        const stockElement = productBox.querySelector("small");
        const currentStock = parseInt(stockElement.textContent.split(": ")[1]);
        
        if (event.target.classList.contains("plus")) {
            const newValue = parseInt(quantityInput.value) + 1;
            if (newValue <= currentStock) {
                quantityInput.value = newValue;
            }
        } else if (event.target.classList.contains("minus")) {
            const newValue = parseInt(quantityInput.value) - 1;
            if (newValue >= 1) {
                quantityInput.value = newValue;
            }
        } else if (event.target.classList.contains("add-to-cart-btn")) {
            const quantity = parseInt(quantityInput.value);
            if (quantity > currentStock) {
                showBubbleNotification("error", "close-circle-outline", `Only ${currentStock} available in stock!`);
                return;
            }
            addToCart(productId, productName, price, quantity);
            quantityInput.value = 1;
        }
    });
}

/* ====================== */
/* TRANSACTIONS SYSTEM */
/* ====================== */
let transactionsUnsubscribe = null;
let allTransactions = [];

async function loadTransactions(userId) {
    const transactionsContainer = document.querySelector(".userDetailsTable > .transactions-table");
    if (!transactionsContainer) return;

    // Create UI elements if they don't exist
    if (!document.getElementById("transactionsSearchContainer")) {
        transactionsContainer.innerHTML = `
            <div id="transactionsSearchContainer" style="margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" id="transactionsSearch" placeholder="🔍 Search by Transaction ID..." 
                           style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex-grow: 1;">
                    <select id="transactionsDateFilter" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="last3days">Last 3 Days</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
                <div id="exportButtons" style="display: flex; gap: 10px; margin-top: 10px;">
                    <button id="exportCSV" class="export-btn" style="background: #4CAF50;">
                        Export to CSV
                    </button>
                    <button id="exportPDF" class="export-btn" style="background: #f44336;">
                        Export to PDF
                    </button>
                </div>
                <div id="transactionsTableContainer"></div>
            </div>
        `;

        // Add event listeners
        document.getElementById("transactionsSearch").addEventListener("input", applyTransactionsFilters);
        document.getElementById("transactionsDateFilter").addEventListener("change", applyTransactionsFilters);
        document.getElementById("exportCSV").addEventListener("click", exportToCSV);
        document.getElementById("exportPDF").addEventListener("click", exportToPDF);
    }

    // Unsubscribe from previous listener if exists
    if (transactionsUnsubscribe) {
        transactionsUnsubscribe();
    }

    try {
        const q = query(
            collection(db, "users", userId, "transactions"), 
            orderBy("transactionDate", "desc")
        );

        // Set up real-time listener
        transactionsUnsubscribe = onSnapshot(q, (querySnapshot) => {
            allTransactions = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    dateObj: new Date(data.transactionDate)
                };
            });
            applyTransactionsFilters();
        });

    } catch (error) {
        console.error("Error loading transactions:", error);
        showBubbleNotification("error", "alert-circle-outline", "Failed to load transactions.");
    }
}

function applyTransactionsFilters() {
    const searchTerm = document.getElementById("transactionsSearch")?.value.toLowerCase() || "";
    const dateFilter = document.getElementById("transactionsDateFilter")?.value || "all";
    const filtered = filterTransactions(allTransactions, searchTerm, dateFilter);
    renderTransactions(filtered);
}

function filterTransactions(transactions, searchTerm, dateFilter) {
    let results = [...transactions];
    
    // Date filtering
    if (dateFilter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch(dateFilter) {
            case "today":
                results = results.filter(t => {
                    const d = new Date(t.transactionDate);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime() === today.getTime();
                });
                break;
                
            case "yesterday":
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                results = results.filter(t => {
                    const d = new Date(t.transactionDate);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime() === yesterday.getTime();
                });
                break;
                
            case "last3days":
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                results = results.filter(t => new Date(t.transactionDate) >= threeDaysAgo);
                break;
                
            case "week":
                const startOfWeek = new Date();
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                results = results.filter(t => new Date(t.transactionDate) >= startOfWeek);
                break;
                
            case "month":
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                results = results.filter(t => new Date(t.transactionDate) >= startOfMonth);
                break;
        }
    }
    
    // Search filtering
    if (searchTerm) {
        results = results.filter(t => 
            t.transactionId.toLowerCase().includes(searchTerm)
        );
    }
    
    return results;
}

function renderTransactions(transactions) {
    const container = document.getElementById("transactionsTableContainer");
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = `<p class="no-transactions">No matching transactions found</p>`;
        return;
    }
    
    container.innerHTML = `
        <table class="transactions-table">
            <thead>
                <tr>
                    <th>Transaction ID</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(t => `
                    <tr>
                        <td>${t.transactionId}</td>
                        <td>${t.transactionDate}</td>
                        <td>${formatCurrency(t.total)}</td>
                        <td>${t.items.length}</td>
                        <td>
                            <button class="btn-view" onclick="showTransactionDetails('${t.id}')">
                                View
                            </button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

/* ====================== */
/* UPDATED EXPORT FUNCTIONS */
/* ====================== */

function exportToCSV() {
    const filtered = getFilteredTransactions();
    if (filtered.length === 0) {
        showBubbleNotification("warning", "alert-circle-outline", "No transactions to export");
        return;
    }

    // Get current user's name/email
    const user = auth.currentUser;
    const userName = user?.displayName || user?.email || "Unknown User";
    
    // Create CSV content with proper formatting
    let csv = `"Generated by:","${userName}"\n`;
    csv += `"Export Time:","${new Date().toLocaleString()}"\n\n`;
    csv += "Transaction ID,Date,Total,Items Count\n";
    
    filtered.forEach(t => {
        // Force Transaction ID to be treated as text by Excel
        const formattedId = `="${t.transactionId}"`;
        csv += `${formattedId},"${t.transactionDate}",P${t.total.toFixed(2)},${t.items.length}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${formatDateTimeForFilename()}.csv`;
    a.click();
    
    showBubbleNotification("success", "checkmark-circle-outline", "CSV exported successfully");
}

function exportToPDF() {
    const filtered = getFilteredTransactions();
    if (filtered.length === 0) {
        showBubbleNotification("warning", "alert-circle-outline", "No transactions to export");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get current user's name/email
    const user = auth.currentUser;
    const userName = user?.displayName || user?.email || "Unknown User";
    
    // Title
    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 15);
    
    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated by: ${userName}`, 14, 22);
    doc.text(`Export Time: ${new Date().toLocaleString()}`, 14, 29);
    
    // Filters info
    const dateFilter = document.getElementById("transactionsDateFilter").value;
    const searchTerm = document.getElementById("transactionsSearch").value;
    let filters = "All Transactions";
    if (dateFilter !== "all") {
        filters = `${document.getElementById("transactionsDateFilter").selectedOptions[0].text}`;
    }
    if (searchTerm) {
        filters += `, Search: "${searchTerm}"`;
    }
    doc.text(`Filters: ${filters}`, 14, 36);
    
    // Table data
    const headers = [["ID", "Date", "Total", "Items"]];
    const data = filtered.map(t => [
        t.transactionId, 
        t.transactionDate,
        `P${t.total.toFixed(2)}`, 
        t.items.length
    ]);
    
    // Generate table
    doc.autoTable({
        head: headers,
        body: data,
        startY: 45,
        headStyles: {
            fillColor: [106, 27, 154], // Purple
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            halign: 'left'
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 'auto' }
        }
    });
    
    doc.save(`transactions_${formatDateTimeForFilename()}.pdf`);
    showBubbleNotification("success", "checkmark-circle-outline", "PDF exported successfully");
}

/* ====================== */
/* HELPER FUNCTIONS */
/* ====================== */

function formatDateTimeForFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

function getFilteredTransactions() {
    const searchTerm = document.getElementById("transactionsSearch")?.value.toLowerCase() || "";
    const dateFilter = document.getElementById("transactionsDateFilter")?.value || "all";
    return filterTransactions(allTransactions, searchTerm, dateFilter);
}

/* ====================== */
/* TRANSACTION DETAILS */
/* ====================== */
window.showTransactionDetails = async function (transactionId) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const transactionDoc = await getDoc(doc(db, "users", user.uid, "transactions", transactionId));
        if (!transactionDoc.exists()) {
            showBubbleNotification("error", "alert-circle-outline", "Transaction not found");
            return;
        }

        const transaction = transactionDoc.data();

        const popup = document.createElement("div");
        popup.className = "transaction-popup active";
        popup.innerHTML = `
            <div class="popup-content">
                <span class="close-popup" onclick="closePopup()">&times;</span>
                <h2>Transaction Details</h2>
                <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
                <p><strong>Date:</strong> ${transaction.transactionDate}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transaction.items.map(item => `
                            <tr>
                                <td>${item.itemName}</td>
                                <td>${item.quantity}</td>
                                <td>${formatCurrency(item.unitPrice)}</td>
                                <td>${formatCurrency(item.unitPrice * item.quantity)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                
                <div class="transaction-total">
                    <strong>Total Amount: ${formatCurrency(transaction.total)}</strong>
                </div>
                
                <button onclick="closePopup()">Close</button>
            </div>
        `;

        document.body.appendChild(popup);
    } catch (error) {
        console.error("Error showing transaction details:", error);
        showBubbleNotification("error", "alert-circle-outline", "Failed to load transaction details.");
    }
};

window.closePopup = function () {
    const popup = document.querySelector(".transaction-popup");
    if (popup) {
        popup.remove();
    }
};

/* ====================== */
/* PURCHASE SYSTEM */
/* ====================== */
async function completePurchase(userId) {
    if (cart.length === 0) {
        showBubbleNotification("error", "close-circle-outline", "Cannot complete purchase with empty cart!");
        return;
    }

    try {
        // First validate all items in cart
        for (const item of cart) {
            const productRef = doc(db, "users", userId, "products", item.id);
            const productDoc = await getDoc(productRef);
            
            if (!productDoc.exists()) {
                showBubbleNotification("error", "close-circle-outline", `Product ${item.name} no longer exists!`);
                return;
            }

            const currentQuantity = productDoc.data().quantity;
            if (currentQuantity < item.quantity) {
                showBubbleNotification("error", "close-circle-outline", 
                    `Not enough stock for ${item.name}. Only ${currentQuantity} available.`);
                return;
            }
        }

        // Process transaction
        const transactionId = Date.now().toString();
        const transactionDate = new Date().toLocaleString();

        const transactionData = {
            transactionId,
            transactionDate,
            items: cart.map(item => ({
                itemId: item.id,
                itemName: item.name,
                quantity: item.quantity,
                unitPrice: item.price
            })),
            total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        };

        // Add transaction
        await addDoc(collection(db, "users", userId, "transactions"), transactionData);

        // Update stock levels
        const updatePromises = cart.map(item => {
            const productRef = doc(db, "users", userId, "products", item.id);
            return getDoc(productRef).then(productDoc => {
                const currentQuantity = productDoc.data().quantity;
                return updateDoc(productRef, {
                    quantity: currentQuantity - item.quantity
                });
            });
        });

        await Promise.all(updatePromises);

        // Clear cart
        cart = [];
        saveCart();
        updateCart();
        updatePurchaseButton();

        // Reload products to reflect updated quantities
        await loadProducts(userId);

        showBubbleNotification("success", "checkmark-circle-outline", "Purchase completed successfully!");

    } catch (error) {
        console.error("Error completing purchase:", error);
        showBubbleNotification("error", "alert-circle-outline", "Failed to complete purchase.");
    }
}

/* ====================== */
/* ANALYTICS SYSTEM */
/* ====================== */
async function loadProductsForAnalytics(userId) {
    try {
        const q = query(collection(db, "users", userId, "products"));
        const querySnapshot = await getDocs(q);

        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        renderCategoryPieChart(products);
        renderQuantityBarChart(products);
        renderExpiryLineChart(products);
    } catch (error) {
        console.error("Error loading products for analytics:", error);
        showBubbleNotification("error", "alert-circle-outline", "Failed to load analytics data.");
    }
}

function renderCategoryPieChart(products) {
    const ctx = document.getElementById("categoryPieChart")?.getContext("2d");
    if (!ctx) return;

    const categoryCounts = {};
    products.forEach(product => {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    });

    new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(categoryCounts),
            datasets: [{
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
    const ctx = document.getElementById("quantityBarChart")?.getContext("2d");
    if (!ctx) return;

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: products.map(p => p.name),
            datasets: [{
                label: "Stock Quantity",
                data: products.map(p => p.quantity),
                backgroundColor: "#36A2EB"
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
    const ctx = document.getElementById("expiryLineChart")?.getContext("2d");
    if (!ctx) return;

    const today = new Date();
    const expiryData = products.map(product => {
        if (!product.expirationDate) return 0;
        const expiryDate = new Date(product.expirationDate);
        return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    });

    new Chart(ctx, {
        type: "line",
        data: {
            labels: products.map(p => p.name),
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

/* ====================== */
/* SALES REPORT SYSTEM */
/* ====================== */
let salesReportUnsubscribe = null;
let allSalesData = [];

async function loadSalesReport(userId) {
    try {
        // Unsubscribe from previous listener if exists
        if (salesReportUnsubscribe) {
            salesReportUnsubscribe();
        }

        // Set up real-time listener for transactions
        const q = query(
            collection(db, "users", userId, "transactions"),
            orderBy("transactionDate", "desc")
        );

        salesReportUnsubscribe = onSnapshot(q, (querySnapshot) => {
            allSalesData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    dateObj: new Date(data.transactionDate)
                };
            });
            applySalesFilters();
        });

    } catch (error) {
        console.error("Error loading sales data:", error);
        showBubbleNotification("error", "alert-circle-outline", "Failed to load sales data.");
    }
}

function applySalesFilters() {
    const period = document.getElementById("reportPeriod").value;
    let filtered = [...allSalesData];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Apply date filters based on selected period
    switch(period) {
        case "daily":
            filtered = filtered.filter(sale => {
                const saleDate = new Date(sale.transactionDate);
                saleDate.setHours(0, 0, 0, 0);
                return saleDate.getTime() === today.getTime();
            });
            break;
            
        case "weekly":
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            filtered = filtered.filter(sale => new Date(sale.transactionDate) >= startOfWeek);
            break;
            
        case "monthly":
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            filtered = filtered.filter(sale => new Date(sale.transactionDate) >= startOfMonth);
            break;
            
        case "custom":
            const startDate = document.getElementById("startDate").value;
            const endDate = document.getElementById("endDate").value;
            
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                
                filtered = filtered.filter(sale => {
                    const saleDate = new Date(sale.transactionDate);
                    return saleDate >= start && saleDate <= end;
                });
            }
            break;
    }

    updateSalesReport(filtered);
}

function updateSalesReport(filteredSales) {
    // Update summary cards
    updateSummaryCards(filteredSales);
    
    // Update charts
    updateSalesCharts(filteredSales);
    
    // Update sales details table
    updateSalesDetailsTable(filteredSales);
}

function updateSummaryCards(sales) {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = sales.length;
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    document.getElementById("totalRevenue").textContent = formatCurrency(totalRevenue);
    document.getElementById("totalSales").textContent = totalSales;
    document.getElementById("averageSale").textContent = formatCurrency(averageSale);
}

function updateSalesCharts(sales) {
    // Group sales by date for trend chart
    const salesByDate = {};
    sales.forEach(sale => {
        const date = new Date(sale.transactionDate).toLocaleDateString();
        salesByDate[date] = (salesByDate[date] || 0) + sale.total;
    });
    
    // Group sales by product for performance chart
    const salesByProduct = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            salesByProduct[item.itemName] = (salesByProduct[item.itemName] || 0) + (item.quantity * item.unitPrice);
        });
    });
    
    // Update or create trend chart
    updateTrendChart(Object.keys(salesByDate), Object.values(salesByDate));
    
    // Update or create product performance chart
    updateProductPerformanceChart(Object.keys(salesByProduct), Object.values(salesByProduct));
}

function updateTrendChart(labels, data) {
    const ctx = document.getElementById("salesTrendChart").getContext("2d");
    
    // Destroy existing chart if it exists
    if (window.salesTrendChart) {
        window.salesTrendChart.destroy();
    }
    
    window.salesTrendChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Daily Revenue",
                data: data,
                backgroundColor: "rgba(106, 27, 154, 0.2)",
                borderColor: "rgba(106, 27, 154, 1)",
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Sales Trend"
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

function updateProductPerformanceChart(labels, data) {
    const ctx = document.getElementById("productPerformanceChart").getContext("2d");
    
    // Destroy existing chart if it exists
    if (window.productPerformanceChart) {
        window.productPerformanceChart.destroy();
    }
    
    // Sort products by revenue and take top 10
    const products = labels.map((label, index) => ({
        name: label,
        revenue: data[index]
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    
    window.productPerformanceChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: products.map(p => p.name),
            datasets: [{
                label: "Revenue",
                data: products.map(p => p.revenue),
                backgroundColor: "rgba(106, 27, 154, 0.7)",
                borderColor: "rgba(106, 27, 154, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Top Performing Products"
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

function updateSalesDetailsTable(sales) {
    const tableBody = document.querySelector("#salesDetailsTable tbody");
    tableBody.innerHTML = "";
    
    // Flatten sales data to show each item in its own row
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const row = document.createElement("tr");
            
            // Calculate profit (assuming cost is stored in the product data)
            // You'll need to modify this based on your actual data structure
            const profit = item.unitPrice * item.quantity; // Simplified for example
            
            row.innerHTML = `
                <td>${sale.transactionDate}</td>
                <td>${sale.transactionId}</td>
                <td>${item.itemName}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(item.unitPrice * item.quantity)}</td>
                <td>${formatCurrency(profit)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    });
}

/* ====================== */
/* EXPORT FUNCTIONALITY */
/* ====================== */

document.getElementById("exportReportBtn").addEventListener("click", exportSalesReport);

function exportSalesReport() {
    const period = document.getElementById("reportPeriod").value;
    let filtered = [...allSalesData];
    let fileName = `sales_report_${period}`;
    
    // Apply the same filters as the current view
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch(period) {
        case "daily":
            filtered = filtered.filter(sale => {
                const saleDate = new Date(sale.transactionDate);
                saleDate.setHours(0, 0, 0, 0);
                return saleDate.getTime() === today.getTime();
            });
            fileName += `_${today.toISOString().split('T')[0]}`;
            break;
            
        case "weekly":
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            filtered = filtered.filter(sale => new Date(sale.transactionDate) >= startOfWeek);
            fileName += `_week_${today.getFullYear()}_${today.getMonth() + 1}`;
            break;
            
        case "monthly":
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            filtered = filtered.filter(sale => new Date(sale.transactionDate) >= startOfMonth);
            fileName += `_${today.getFullYear()}_${today.getMonth() + 1}`;
            break;
            
        case "custom":
            const startDate = document.getElementById("startDate").value;
            const endDate = document.getElementById("endDate").value;
            
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                
                filtered = filtered.filter(sale => {
                    const saleDate = new Date(sale.transactionDate);
                    return saleDate >= start && saleDate <= end;
                });
                
                fileName += `_from_${startDate}_to_${endDate}`;
            }
            break;
    }
    
    if (filtered.length === 0) {
        showBubbleNotification("warning", "alert-circle-outline", "No sales data to export");
        return;
    }
    
    // Get current user's name/email for report metadata
    const user = auth.currentUser;
    const userName = user?.displayName || user?.email || "Unknown User";
    
    // Create PDF export
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Sales Report", 14, 15);
    
    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated by: ${userName}`, 14, 22);
    doc.text(`Export Time: ${new Date().toLocaleString()}`, 14, 29);
    doc.text(`Report Period: ${period}`, 14, 36);
    
    if (period === "custom" && startDate && endDate) {
        doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 43);
    }
    
    // Summary section
    const totalRevenue = filtered.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = filtered.length;
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    doc.setFontSize(12);
    doc.text("Summary", 14, 55);
    
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 14, 65);
    doc.text(`Total Sales: ${totalSales}`, 14, 72);
    doc.text(`Average Sale: ${formatCurrency(averageSale)}`, 14, 79);
    
    // Sales details table
    const headers = [["Date", "Transaction ID", "Product", "Qty", "Unit Price", "Total", "Profit"]];
    
    // Flatten sales data for table
    const tableData = [];
    filtered.forEach(sale => {
        sale.items.forEach(item => {
            const profit = item.unitPrice * item.quantity; // Simplified - adjust as needed
            tableData.push([
                sale.transactionDate,
                sale.transactionId,
                item.itemName,
                item.quantity.toString(),
                formatCurrency(item.unitPrice),
                formatCurrency(item.unitPrice * item.quantity),
                formatCurrency(profit)
            ]);
        });
    });
    
    doc.autoTable({
        head: headers,
        body: tableData,
        startY: 90,
        headStyles: {
            fillColor: [106, 27, 154], // Purple
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 'auto' },
            5: { cellWidth: 'auto' },
            6: { cellWidth: 'auto' }
        }
    });
    
    doc.save(`${fileName}.pdf`);
    showBubbleNotification("success", "checkmark-circle-outline", "Sales report exported successfully");
}

/* ====================== */
/* RECENT PRODUCTS */
/* ====================== */
async function loadRecentProducts(userId) {
    const recentProductsBody = document.getElementById("recentProductsBody");
    if (!recentProductsBody) return;

    recentProductsBody.innerHTML = "";

    try {
        const q = query(
            collection(db, "users", userId, "products"), 
            orderBy("date", "desc"), 
            limit(5)
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.quantity}</td>
                <td class="actions">
                    <button class="btn-edit"><ion-icon name="create-outline"></ion-icon></button>
                    <button class="btn-delete"><ion-icon name="trash-outline"></ion-icon></button>
                </td>
            `;

            recentProductsBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading recent products:", error);
        showBubbleNotification("error", "alert-circle-outline", "Failed to load recent products.");
    }
}

/* ====================== */
/* NAVIGATION */
/* ====================== */
function setupNavigation() {
    document.querySelectorAll(".navList").forEach(element => {
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

/* ====================== */
/* CART EVENT LISTENERS */
/* ====================== */
function setupCartEventListeners() {
    const cartContainer = document.querySelector(".cart-container");
    if (!cartContainer) return;

    cartContainer.addEventListener("click", (event) => {
        const cartBox = event.target.closest(".cart-box");
        if (!cartBox) return;

        const itemId = cartBox.dataset.itemId;
        
        if (event.target.classList.contains("remove-btn")) {
            removeFromCart(itemId);
        } else if (event.target.classList.contains("minus")) {
            const quantityInput = cartBox.querySelector(".cart-quantity");
            const newQuantity = parseInt(quantityInput.value) - 1;
            setCartItemQuantity(itemId, newQuantity);
        } else if (event.target.classList.contains("plus")) {
            const quantityInput = cartBox.querySelector(".cart-quantity");
            const newQuantity = parseInt(quantityInput.value) + 1;
            setCartItemQuantity(itemId, newQuantity);
        }
    });

    cartContainer.addEventListener("change", (event) => {
        if (event.target.classList.contains("cart-quantity")) {
            const cartBox = event.target.closest(".cart-box");
            if (!cartBox) return;

            const itemId = cartBox.dataset.itemId;
            const newQuantity = parseInt(event.target.value);
            setCartItemQuantity(itemId, newQuantity);
        }
    });
}

/* ====================== */
/* NOTIFICATIONS LOADING */
/* ====================== */
async function loadNotifications(userId) {
    const notificationsContainer = document.getElementById("notificationsContainer");
    if (!notificationsContainer) return;

    notificationsContainer.innerHTML = "";

    try {
        const q = query(collection(db, "users", userId, "products"));
        const querySnapshot = await getDocs(q);

        const today = new Date();
        const notifications = [];

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            if (!product.expirationDate) return;
            
            const expirationDate = new Date(product.expirationDate);
            const daysUntilExpiration = Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24));

            if (product.quantity <= (product.lowStockThreshold || 5)) {
                notifications.push({
                    type: "warning",
                    icon: "warning-outline",
                    message: `Low stock for ${product.name}. Only ${product.quantity} left!`
                });
            }

            if (daysUntilExpiration <= 7 && daysUntilExpiration >= 0) {
                notifications.push({
                    type: "warning",
                    icon: "time-outline",
                    message: `${product.name} is expiring in ${daysUntilExpiration} days!`
                });
            }

            if (product.quantity === 0) {
                notifications.push({
                    type: "error",
                    icon: "close-circle-outline",
                    message: `${product.name} is out of stock!`
                });
            }

            if (daysUntilExpiration < 0) {
                notifications.push({
                    type: "error",
                    icon: "alert-circle-outline",
                    message: `${product.name} has expired!`
                });
            }
        });

        notifications.forEach(notification => {
            const notificationElement = document.createElement("div");
            notificationElement.className = `notification ${notification.type === "error" ? "out-of-stock" : 
                                          notification.type === "warning" ? "low-stock" : "expiring"}`;
            notificationElement.textContent = notification.message;
            notificationsContainer.appendChild(notificationElement);
        });

        showBubbleNotifications(notifications);

    } catch (error) {
        console.error("Error loading notifications:", error);
        showBubbleNotification("error", "alert-circle-outline", "Failed to load notifications.");
    }
}

async function loadDashboardCounts(userId) {
    try {
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

    } catch (error) {
        console.error("❌ Error loading dashboard counts:", error);
    }
}

/* ====================== */
/* SALES REPORT INITIALIZATION */
/* ====================== */
function initSalesReport() {
    // Set up event listeners
    document.getElementById("reportPeriod").addEventListener("change", function() {
        const customDateRange = document.getElementById("customDateRange");
        customDateRange.style.display = this.value === "custom" ? "flex" : "none";
        applySalesFilters();
    });
    
    document.getElementById("generateReportBtn").addEventListener("click", applySalesFilters);
    
    // Set default dates for custom range
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    document.getElementById("startDate").valueAsDate = oneWeekAgo;
    document.getElementById("endDate").valueAsDate = today;
    
    // Add change listeners for custom date inputs
    document.getElementById("startDate").addEventListener("change", function() {
        if (document.getElementById("reportPeriod").value === "custom") {
            applySalesFilters();
        }
    });
    
    document.getElementById("endDate").addEventListener("change", function() {
        if (document.getElementById("reportPeriod").value === "custom") {
            applySalesFilters();
        }
    });
}

/* ====================== */
/* INITIALIZATION */
/* ====================== */
function initApp() {
    setupNavigation();
    setupCartEventListeners();
    updateCart();
    updatePurchaseButton();
    initSalesReport();

    const completePurchaseBtn = document.getElementById("completePurchaseBtn");
    if (completePurchaseBtn) {
        completePurchaseBtn.addEventListener("click", () => {
            const user = auth.currentUser;
            if (user) {
                completePurchase(user.uid);
            }
        });
    }

    window.filterProducts = function () {
        const searchQuery = document.getElementById("search")?.value.toLowerCase();
        if (!searchQuery) return;

        const products = document.querySelectorAll(".product-box");
        products.forEach(product => {
            const productName = product.querySelector("p").textContent.toLowerCase();
            product.style.display = productName.includes(searchQuery) ? "flex" : "none";
        });
    };

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadProducts(user.uid);
            loadNotifications(user.uid);
            loadProductsForAnalytics(user.uid);
            loadTransactions(user.uid);
            loadRecentProducts(user.uid);
            loadDashboardCounts(user.uid);
            loadSalesReport(user.uid);
        } else {
            showBubbleNotification("error", "alert-circle-outline", "You are not logged in!");
            window.location.href = "login.html";
        }
    });
}

document.addEventListener("DOMContentLoaded", initApp);