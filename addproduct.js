import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { addDoc, collection, getDocs, getFirestore, limit, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '') return '₱0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return '₱' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0] + ' ' + 
           date.toTimeString().split(' ')[0].substring(0, 8);
}

function generateBatchId() {
    return 'batch_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("#addProductForm form");

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.warn("⚠ No user detected, redirecting...");
            alert("⚠ You are not logged in!");
            window.location.href = "login.html";
            return;
        }

        loadRecentProducts(user.uid);

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const productName = document.getElementById("productName").value.trim();
            const category = document.getElementById("productCategory").value;
            const price = parseFloat(document.getElementById("productPrice").value) || 0;
            const quantity = parseInt(document.getElementById("productQuantity").value) || 0;
            const expirationDate = document.getElementById("expirationDate").value;
            const lowStockThreshold = parseInt(document.getElementById("lowStockThreshold").value) || 0;
            const description = document.getElementById("productDescription").value.trim();
            const now = new Date();

            if (!productName || !category || !price || !quantity || !lowStockThreshold) {
                alert("❌ Please fill out all required fields.");
                return;
            }

            try {
                const initialBatch = {
                    batchID: generateBatchId(),
                    quantity: quantity,
                    expirationDate: expirationDate || null,
                    dateAdded: now.toISOString(),
                    addedFormatted: formatTimestamp(now.toISOString())
                };

                await addDoc(collection(db, "users", user.uid, "products"), {
                    name: productName,
                    category: category,
                    price: price,
                    quantity: quantity,
                    batches: [initialBatch],
                    expirationDate: expirationDate || null,
                    lowStockThreshold: lowStockThreshold,
                    description: description,
                    date: now.toISOString()
                });

                console.log("✅ Product added successfully!");
                alert("✅ Product added successfully!");

                form.reset();
                loadRecentProducts(user.uid);
            } catch (error) {
                console.error("❌ Error adding product:", error);
                alert("❌ Failed to add product.");
            }
        });
    });
});

async function loadRecentProducts(userId) {
    const recentProductsBody = document.getElementById("recentProductsBody");
    recentProductsBody.innerHTML = "";

    try {
        const q = query(collection(db, "users", userId, "products"), orderBy("date", "desc"), limit(5));
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
        console.error("❌ Error loading recent products:", error);
        alert("❌ Failed to load recent products.");
    }
}