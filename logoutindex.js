import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCzJLBy4fu8fIh0WmnjC9dKG_m1t-wI-Oc",
    authDomain: "bizventory-9c36a.firebaseapp.com",
    projectId: "bizventory-9c36a",
    storageBucket: "bizventory-9c36a.appspot.com",
    messagingSenderId: "741369398731",
    appId: "1:741369398731:web:0abb56947e39d76bbb224e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

console.log("✅ logoutindex.js running!");

document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.querySelector("#logout");
    const profileName = document.querySelector('.profile'); // Target Profile Name

    async function typeWriter(text, element) {
        element.textContent = "";
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, 100)); // Delay per letter
        }
    }

    // Detect Auth Changes
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            profileName.textContent = "Loading...";
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();
            console.log("✅ Logged in as:", user.email);
            await typeWriter(`${userData.firstName} ${userData.lastName}`, profileName);
            
            // While fetching name


            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    profileName.textContent = `${userData.firstName} ${userData.lastName}`;
                    console.log("✅ Name fetched:", `${userData.firstName} ${userData.lastName}`);
                } else {
                    profileName.textContent = "Admin User";
                }
            } catch (error) {
                console.error("❌ Firestore Error:", error);
                profileName.textContent = "User";
            }
        } else {
            console.log("❌ No User Logged In");
            window.location.href = "login.html"; // Redirect to Login
        }       
    });

    // Logout System
    if (logoutButton) {
        logoutButton.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                console.log("✅ User signed out");
                window.location.href = "login.html";
            } catch (error) {
                console.error("❌ Sign-out error:", error);
            }
        });
    } else {
        console.log("❌ Logout button not found");
    }
});
