import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { doc, getFirestore, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCzJLBy4fu8fIh0WmnjC9dKG_m1t-wI-Oc",
    authDomain: "bizventory-9c36a.firebaseapp.com",
    projectId: "bizventory-9c36a",
    storageBucket: "bizventory-9c36a.appspot.com",
    messagingSenderId: "741369398731",
    appId: "1:741369398731:web:0abb56947e39d76bbb224e"
};

// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();



// SIGN UP FUNCTION WITH PASSWORD CHECK
document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const firstName = document.getElementById('signup-firstname').value;
    const lastName = document.getElementById('signup-lastname').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Check if passwords match
    if (password !== confirmPassword) {
        alert("Passwords do not match! Please re-enter your password.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // STORE USER DATA IN FIRESTORE
        await setDoc(doc(db, "users", user.uid), { firstName, lastName, email, password });

        alert("Account Created Successfully!");
        window.location.href = 'login.html';
    } catch (error) {
        alert(error.message);
    }
});

// LOGIN FUNCTION
document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login Successful!");
        window.location.href = 'index.html';
    } catch (error) {
            alert("Invalid login credentials!");
            return error;
        }
    });
