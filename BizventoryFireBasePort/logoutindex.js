import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

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


console.log("✅ firebaseauth.js is running!");
console.log(document.querySelector("#logout") ? "✅ Logout button found" : "❌ Logout button missing");

document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.querySelector('#logout');

    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const auth = getAuth(); // Initialize Firebase Auth

            try {
                await signOut(auth); // Firebase sign out
                console.log('User has signed out'); 
                window.location.href = 'login.html';  // Redirect after logout
            } catch (error) {
                console.error('Sign-out error:', error);
            }
        });
    } else {
        console.log('Logout button not found on this page.');
    }
});
