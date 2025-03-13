import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, getDocs, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", function () {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.warn("⚠ No user detected, redirecting...");
            alert("⚠ You are not logged in!");
            window.location.href = "login.html";
            return;
        }

        // Load products by category
        loadProductsByCategory(user.uid);

        // Popup 
        const popup = document.getElementById("modifyProductPopup");
        const closePopupButtons = document.querySelectorAll(".close-popup");

        closePopupButtons.forEach(button => {
            button.addEventListener("click", () => {
                popup.style.display = "none"; // Hide popup
            });
        });

        // Modify product form submission
        const modifyProductForm = document.getElementById("modifyProductForm");
        modifyProductForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const productId = modifyProductForm.getAttribute("data-product-id");
            const productName = document.getElementById("modifyProductName").value.trim();
            const category = document.getElementById("modifyProductCategory").value;
            const price = parseFloat(document.getElementById("modifyProductPrice").value) || 0;
            const quantity = parseInt(document.getElementById("modifyProductQuantity").value) || 0;
            const expirationDate = document.getElementById("modifyExpirationDate").value;
            const lowStockThreshold = parseInt(document.getElementById("modifyLowStockThreshold").value) || 0;
            const description = document.getElementById("modifyProductDescription").value.trim();

            if (!productName || !category || !price || !quantity || !lowStockThreshold) {
                alert("❌ Please fill out all required fields.");
                return;
            }

            try {
                await updateDoc(doc(db, "users", user.uid, "products", productId), {
                    name: productName,
                    category: category,
                    price: price,
                    quantity: quantity,
                    expirationDate: expirationDate || null,
                    lowStockThreshold: lowStockThreshold,
                    description: description
                });

                console.log("✅ Product updated successfully!");
                alert("✅ Product updated successfully!");

                popup.style.display = "none"; // Hide popup after save
                loadProductsByCategory(user.uid); // Refresh list
            } catch (error) {
                console.error("❌ Error updating product:", error);
                alert("❌ Failed to update product.");
            }
        });
    });
});

async function loadProductsByCategory(userId) {
    const productsByCategory = document.getElementById("productsByCategory");
    productsByCategory.innerHTML = ""; 

    try {
        const q = query(collection(db, "users", userId, "products"), orderBy("category"));
        const querySnapshot = await getDocs(q);

        const categories = {};

        // Group products by category
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            if (!categories[product.category]) {
                categories[product.category] = [];
            }
            categories[product.category].push({ id: doc.id, ...product });
        });

        // Display products by category
        for (const category in categories) {
            const categorySection = document.createElement("div");
            categorySection.className = "category-section";

            const categoryHeader = document.createElement("h3");
            categoryHeader.textContent = category;
            categorySection.appendChild(categoryHeader);

            const table = document.createElement("table");
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories[category].map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>₱${product.price.toFixed(2)}</td>
                            <td>${product.quantity}</td>
                            <td class="actions">
                                <button class="btn-modify" data-id="${product.id}">
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            `;

            categorySection.appendChild(table);
            productsByCategory.appendChild(categorySection);
        }

        // Event listeners
        const modifyButtons = document.querySelectorAll(".btn-modify");
        modifyButtons.forEach(button => {
            button.addEventListener("click", async (event) => {
                const productId = event.currentTarget.getAttribute("data-id");
                const popup = document.getElementById("modifyProductPopup");
                const modifyProductForm = document.getElementById("modifyProductForm");

                // Fetch product details
                try {
                    const productDoc = await getDoc(doc(db, "users", userId, "products", productId));
                    const product = productDoc.data();

                    document.getElementById("modifyProductName").value = product.name;
                    document.getElementById("modifyProductCategory").value = product.category;
                    document.getElementById("modifyProductPrice").value = product.price;
                    document.getElementById("modifyProductQuantity").value = product.quantity;
                    document.getElementById("modifyExpirationDate").value = product.expirationDate || "";
                    document.getElementById("modifyLowStockThreshold").value = product.lowStockThreshold;
                    document.getElementById("modifyProductDescription").value = product.description || "";

                    // Set product ID 
                    modifyProductForm.setAttribute("data-product-id", productId);

                    // Popup
                    popup.style.display = "flex";
                } catch (error) {
                    console.error("❌ Error fetching product details:", error);
                    alert("❌ Failed to fetch product details.");
                }
            });
        });
    } catch (error) {
        console.error("❌ Error loading products:", error);
        alert("❌ Failed to load products.");
    }
}