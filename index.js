document.addEventListener("DOMContentLoaded", function () {
    const toggleForm = document.getElementById('toggle-form');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const formTitle = document.getElementById('form-title');
    const toggleForgotPasswordLink = document.getElementById('toggle-forgot-password');
    const toggleBackToLoginLink = document.getElementById('toggle-back-to-login');
    const toggleSignupFromForgotLink = document.getElementById('toggle-signup-from-forgot');

    // Toggle between Login and Sign Up forms
    toggleForm.addEventListener('click', function (e) {
        e.preventDefault();
        if (loginForm.style.display === "none") {
            // Switch to Login form
            loginForm.style.display = "block";
            signupForm.style.display = "none";
            forgotPasswordForm.style.display = "none";
            formTitle.innerText = "Login To Bizventory";
            toggleForm.innerHTML = `Don't have an account? <a href="#">Sign Up</a>`;
            toggleForm.style.display = "block"; // Show the toggle link
        } else {
            // Switch to Sign Up form
            loginForm.style.display = "none";
            signupForm.style.display = "block";
            forgotPasswordForm.style.display = "none";
            formTitle.innerText = "Sign Up for Bizventory";
            toggleForm.innerHTML = `Already have an account? <a href="#">Log In</a>`;
            toggleForm.style.display = "block"; // Show the toggle link
        }
    });

    // Toggle to Forgot Password form
    toggleForgotPasswordLink.addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.style.display = "none";
        signupForm.style.display = "none";
        forgotPasswordForm.style.display = "block";
        formTitle.innerText = "Forgot Password";
        toggleForm.style.display = "none"; // Hide the toggle link
    });

    // Toggle back to Login form from Forgot Password
    toggleBackToLoginLink.addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.style.display = "block";
        signupForm.style.display = "none";
        forgotPasswordForm.style.display = "none";
        formTitle.innerText = "Login To Bizventory";
        toggleForm.style.display = "block"; // Show the toggle link
    });

    // Toggle to Sign Up form from Forgot Password
    toggleSignupFromForgotLink.addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.style.display = "none";
        signupForm.style.display = "block";
        forgotPasswordForm.style.display = "none";
        formTitle.innerText = "Sign Up for Bizventory";
        toggleForm.innerHTML = `Already have an account? <a href="#">Log In</a>`;
        toggleForm.style.display = "block"; // Show the toggle link
    });
});