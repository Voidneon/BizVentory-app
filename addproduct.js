import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { addDoc, collection, getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
console.log("🚀 addproduct.js loaded!");
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM fully loaded!");

    const form = document.querySelector("#addProductForm form");
      if (!form) {
        console.error("❌ Form element NOT found!");
        alert("❌ Form NOT found in DOM!");
        return;
    } else {
        console.log("✅ Form found successfully!");
    } 

    // Ensure auth state is detected properly
    onAuthStateChanged(auth, (user) => {
        if (!user) {
          console.warn("⚠ No user detected, redirecting...");
          alert("⚠ You are not logged in!");
          window.location.href = "login.html";
          return;
        }

        console.log("✅ Authenticated as:", user.email);

        form.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent page refresh

            const productName = document.getElementById("productName").value.trim();
            const category = document.getElementById("productCategory").value; // ✅ Get selected category
            const price = parseFloat(document.getElementById("productPrice").value) || 0;
            const quantity = parseInt(document.getElementById("productQuantity").value) || 0;
            const description = document.getElementById("productDescription").value.trim();
            const date = new Date().toISOString();
            console.log("📝 Form submit event triggered!"); 
            if (!productName || !category || !price || !quantity || !description) {
                alert("❌ Please fill out all fields.");
                return;
            }

            try {
                await addDoc(collection(db, "users", user.uid, "products"), {
                    name: productName,
                    category: category,
                    price: price,
                    quantity: quantity,
                    description: description,
                    date: date
                });

                console.log("✅ Product added successfully!");
                alert("✅ Product added successfully!");

                form.reset(); // Clear form fields after successful submission
            } catch (error) {
                console.error("❌ Error adding product:", error);
                alert("❌ Failed to add product.");
            }
        });
    });
});
