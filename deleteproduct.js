import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, deleteDoc, doc, getDocs, getFirestore, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
    });
});

async function loadProductsByCategory(userId) {
    const productsByCategory = document.getElementById("productsByCategory");
    productsByCategory.innerHTML = ""; // Clear existing content

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
                                <button class="btn-delete" data-id="${product.id}">
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            `;

            categorySection.appendChild(table);
            productsByCategory.appendChild(categorySection);
        }

        // Add event listeners to delete buttons
        const deleteButtons = document.querySelectorAll(".btn-delete");
        deleteButtons.forEach(button => {
            button.addEventListener("click", async (event) => {
                const productId = event.currentTarget.getAttribute("data-id");
                const confirmDelete = confirm("Are you sure you want to delete this product?");
                if (confirmDelete) {
                    try {
                        await deleteDoc(doc(db, "users", userId, "products", productId));
                        alert("✅ Product deleted successfully!");
                        loadProductsByCategory(userId); // Refresh the list
                    } catch (error) {
                        console.error("❌ Error deleting product:", error);
                        alert("❌ Failed to delete product.");
                    }
                }
            });
        });
    } catch (error) {
        console.error("❌ Error loading products:", error);
        alert("❌ Failed to load products.");
    }
}