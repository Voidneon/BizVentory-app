import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCzJLBy4fu8fFh0WmnjC9dKG_m1t-wI-Oc",
    authDomain: "bizventory-9c36a.firebaseapp.com",
    projectId: "bizventory-9c36a",
    storageBucket: "bizventory-9c36a.appspot.com",
    messagingSenderId: "741369398731",
    appId: "1:741369398731:web:0abb56947e39d76bbb224e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// ... Keep your notification, cart, products, transactions, analytics, purchase, and navigation code here ...
// (Same as in your original post)
// Replace duplicate or conflicting functions per the analysis

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

// ========== Fixed Dashboard Count Loader ==========
async function loadDashboardCounts(userId) {
    try {
        const productsSnapshot = await getDocs(collection(db, "users", userId, "products"));
        const transactionsSnapshot = await getDocs(collection(db, "users", userId, "transactions"));

        document.querySelector(".box1 .number").textContent = productsSnapshot.size;
        document.querySelector(".box2 .number").textContent = transactionsSnapshot.size;

        let todayCount = 0;
        const today = new Date().toLocaleDateString();
        transactionsSnapshot.forEach(doc => {
            const transactionDate = new Date(doc.data().transactionDate).toLocaleDateString();
            if (transactionDate === today) todayCount++;
        });

        document.querySelector(".box4 .number").textContent = todayCount;

    } catch (error) {
        console.error("Error loading dashboard count:", error);
        showBubbleNotification("error", "alert-circle-outline", "Failed to load dashboard statistics.");
    }
}

// ========== Consolidated initApp ==========
function initApp() {
    setupNavigation();
    setupCartEventListeners();
    updateCart();
    updatePurchaseButton();

    const completePurchaseBtn = document.getElementById("completePurchaseBtn");
    if (completePurchaseBtn) {
        completePurchaseBtn.addEventListener("click", () => {
            const user = auth.currentUser;
            if (user) completePurchase(user.uid);
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
            const uid = user.uid;
            loadProducts(uid);
            loadNotifications(uid);
            loadProductsForAnalytics(uid);
            loadTransactions(uid);
            loadRecentProducts(uid);
            loadDashboardCounts(uid);
            setupNavigationTabs(uid);
            const profileName = document.querySelector('.profile .links');
            if (profileName) {
                typeWriter(user.displayName || "Welcome", profileName);
            }
        } else {
            showBubbleNotification("error", "alert-circle-outline", "You are not logged in!");
            window.location.href = "login.html";
        }
    });
}

// ========== Typewriter Text Animation ==========
async function typeWriter(text, element) {
    element.textContent = "";
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await new Promise(resolve => setTimeout(resolve, 100));
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
