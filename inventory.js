import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, getFirestore, orderBy, query, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// Declare selectedProductId in the global scope
let selectedProductId = null;

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchProduct");
    const manageStockPopup = document.getElementById("manageStockPopup");
    const manageStockForm = document.getElementById("manageStockForm");
    const closePopupButtons = document.querySelectorAll(".close-popup");
    const stockAction = document.getElementById("stockAction");
    const batchSelection = document.getElementById("batchSelection");
    const expirationDateField = document.getElementById("expirationDateField");
    const batchSelect = document.getElementById("batchSelect");

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.warn("⚠ No user detected, redirecting...");
            alert("⚠ You are not logged in!");
            window.location.href = "login.html";
            return;
        }

        // Load all products
        loadProducts(user.uid);

        // Search functionality
        searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            filterProducts(searchTerm);
        });

        // Close popup
        closePopupButtons.forEach(button => {
            button.addEventListener("click", () => {
                manageStockPopup.style.display = "none";
            });
        });

        // Show/hide fields based on action
        stockAction.addEventListener("change", () => {
            if (stockAction.value === "increase") {
                batchSelection.style.display = "none";
                expirationDateField.style.display = "block";
            } else if (stockAction.value === "decrease") {
                batchSelection.style.display = "block";
                expirationDateField.style.display = "none";
                loadBatches(user.uid, selectedProductId);
            }
        });

        // Manage stock form submission
        manageStockForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const action = stockAction.value;
            const quantity = parseInt(document.getElementById("stockQuantity").value);
            const expirationDate = document.getElementById("batchExpirationDate").value;
            const selectedBatchId = batchSelect.value;

            if (!action || !quantity || quantity <= 0) {
                alert("❌ Please fill out all required fields.");
                return;
            }

            const confirmAction = confirm(`Are you sure you want to ${action} stock by ${quantity}?`);
            if (!confirmAction) return;

            try {
                const productRef = doc(db, "users", user.uid, "products", selectedProductId);
                const productDoc = await getDoc(productRef);
                const product = productDoc.data();

                // Ensure batches field exists and is an array
                if (!product.batches) {
                    product.batches = [];
                }

                if (action === "increase") {
                    // Add new batch
                    await updateDoc(productRef, {
                        batches: arrayUnion({
                            batchID: new Date().toISOString(),
                            quantity: quantity,
                            expirationDate: expirationDate || null
                        }),
                        quantity: product.quantity + quantity
                    });
                } else if (action === "decrease") {
                    // Decrease stock from selected batch
                    const batch = product.batches.find(b => b.batchID === selectedBatchId);
                    if (!batch || batch.quantity < quantity) {
                        alert("❌ Not enough stock in the selected batch.");
                        return;
                    }
                    await updateDoc(productRef, {
                        batches: arrayRemove(batch),
                        quantity: product.quantity - quantity
                    });
                }

                alert("✅ Stock updated successfully!");
                manageStockPopup.style.display = "none";
                loadProducts(user.uid); // Refresh product list
            } catch (error) {
                console.error("❌ Error updating stock:", error);
                alert("❌ Failed to update stock.");
            }
        });
    });
});

async function loadProducts(userId) {
    const productsBody = document.getElementById("productsBody");
    productsBody.innerHTML = ""; // Clear existing content

    try {
        const q = query(collection(db, "users", userId, "products"), orderBy("name"));
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
                    <button class="btn-manage" data-id="${doc.id}">
                        <ion-icon name="cube-outline"></ion-icon>
                    </button>
                </td>
            `;

            productsBody.appendChild(row);
        });

        // Add event listeners to manage buttons
        const manageButtons = document.querySelectorAll(".btn-manage");
        manageButtons.forEach(button => {
            button.addEventListener("click", (event) => {
                selectedProductId = event.currentTarget.getAttribute("data-id");
                manageStockPopup.style.display = "flex";
            });
        });
    } catch (error) {
        console.error("❌ Error loading products:", error);
        alert("❌ Failed to load products.");
    }
}

async function loadBatches(userId, productId) {
    const batchSelect = document.getElementById("batchSelect");
    batchSelect.innerHTML = ""; // Clear existing options

    try {
        const productRef = doc(db, "users", userId, "products", productId);
        const productDoc = await getDoc(productRef);
        const product = productDoc.data();

        // Ensure batches field exists and is an array
        if (!product.batches) {
            product.batches = [];
        }

        if (product.batches.length > 0) {
            product.batches.forEach(batch => {
                const option = document.createElement("option");
                option.value = batch.batchID;
                option.textContent = `Batch: ${batch.batchID} (Qty: ${batch.quantity})`;
                batchSelect.appendChild(option);
            });
        } else {
            batchSelect.innerHTML = "<option>No batches available</option>";
        }
    } catch (error) {
        console.error("❌ Error loading batches:", error);
        alert("❌ Failed to load batches.");
    }
}

function filterProducts(searchTerm) {
    const rows = document.querySelectorAll("#productsBody tr");
    rows.forEach(row => {
        const productName = row.querySelector("td").textContent.toLowerCase();
        if (productName.includes(searchTerm)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}