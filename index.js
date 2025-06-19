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

    // Handle Login Form Submission
    loginForm.addEventListener('submit', function (e) {
        try {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            console.log(`Attempting Login with Email: ${email}, Password: ${password}`);
        } catch (error) {
            alert('Invalid Credentials. Please try again.');
        }
    });

    // Handle Sign Up Form Submission
    signupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const firstName = document.getElementById('signup-firstname').value;
        const lastName = document.getElementById('signup-lastname').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        console.log(`Signing up: ${firstName} ${lastName} (${email})`);
    });

    // Handle Forgot Password Form Submission
    forgotPasswordForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('forgot-password-email').value;
        console.log(`Password reset requested for email: ${email}`);
        // Add your password reset logic here (e.g., Firebase Auth sendPasswordResetEmail)
    });
});