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

/* ====================== */
/* TIMESTAMP FORMATTING */
/* ====================== */
function formatTimestamp(isoString) {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toISOString().split('T')[0] + ' ' + 
           date.toTimeString().split(' ')[0].substring(0, 8);
}

function generateBatchId() {
    return 'batch_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

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

        loadProducts(user.uid);

        searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            filterProducts(searchTerm);
        });

        closePopupButtons.forEach(button => {
            button.addEventListener("click", () => {
                manageStockPopup.style.display = "none";
            });
        });

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

                if (!product.batches) {
                    product.batches = [];
                }

                if (action === "increase") {
                    const newBatch = {
                        batchID: generateBatchId(),
                        quantity: quantity,
                        expirationDate: expirationDate || null,
                        dateAdded: new Date().toISOString(),
                        addedFormatted: formatTimestamp(new Date().toISOString())
                    };
                    
                    await updateDoc(productRef, {
                        batches: arrayUnion(newBatch),
                        quantity: product.quantity + quantity
                    });
                } else if (action === "decrease") {
                    const batch = product.batches.find(b => b.batchID === selectedBatchId);
                    if (!batch || batch.quantity < quantity) {
                        alert("❌ Not enough stock in the selected batch.");
                        return;
                    }
                    
                    if (batch.quantity === quantity) {
                        await updateDoc(productRef, {
                            batches: arrayRemove(batch),
                            quantity: product.quantity - quantity
                        });
                    } else {
                        const updatedBatch = {
                            ...batch,
                            quantity: batch.quantity - quantity
                        };
                        
                        await updateDoc(productRef, {
                            batches: arrayRemove(batch),
                            quantity: product.quantity - quantity
                        });
                        
                        await updateDoc(productRef, {
                            batches: arrayUnion(updatedBatch)
                        });
                    }
                }

                alert("✅ Stock updated successfully!");
                manageStockPopup.style.display = "none";
                loadProducts(user.uid);
            } catch (error) {
                console.error("❌ Error updating stock:", error);
                alert("❌ Failed to update stock.");
            }
        });
    });
});

async function loadProducts(userId) {
    const productsBody = document.getElementById("productsBody");
    productsBody.innerHTML = "";

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

        const manageButtons = document.querySelectorAll(".btn-manage");
        manageButtons.forEach(button => {
            button.addEventListener("click", (event) => {
                selectedProductId = event.currentTarget.getAttribute("data-id");
                manageStockPopup.style.display = "flex";
                stockAction.value = "increase";
                batchSelection.style.display = "none";
                expirationDateField.style.display = "block";
            });
        });
    } catch (error) {
        console.error("❌ Error loading products:", error);
        alert("❌ Failed to load products.");
    }
}

async function loadBatches(userId, productId) {
    const batchSelect = document.getElementById("batchSelect");
    batchSelect.innerHTML = "";

    try {
        const productRef = doc(db, "users", userId, "products", productId);
        const productDoc = await getDoc(productRef);
        const product = productDoc.data();

        if (!product.batches || product.batches.length === 0) {
            batchSelect.innerHTML = "<option value=''>No batches available</option>";
            return;
        }

        const sortedBatches = [...product.batches].sort((a, b) => 
            new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0)
        );

        sortedBatches.forEach(batch => {
            const option = document.createElement("option");
            option.value = batch.batchID;
            
            let batchInfo = `${batch.addedFormatted || formatTimestamp(batch.dateAdded)} - ${batch.quantity} units`;
            if (batch.expirationDate) {
                batchInfo += ` (Exp: ${new Date(batch.expirationDate).toLocaleDateString()})`;
            }
            
            option.textContent = batchInfo;
            batchSelect.appendChild(option);
        });
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