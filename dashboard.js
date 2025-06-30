// Final merged and cleaned-up `dashboard.js`
// Includes: Auth, Products, Cart, Transactions, Dashboard Counts, Notifications, Analytics

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

// ========== DOMContentLoaded ==========
document.addEventListener("DOMContentLoaded", initApp);
