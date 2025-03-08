
document.addEventListener("DOMContentLoaded", function () {
    const toggleForm = document.getElementById('toggle-form');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const formTitle = document.getElementById('form-title');

    toggleForm.addEventListener('click', function () {
        if (loginForm.style.display === "none") {
            loginForm.style.display = "block";
            signupForm.style.display = "none";
            formTitle.innerText = "Login To Bizventory";
            toggleForm.innerHTML = `Don't have an account? <a href="#">Sign Up</a>`;
        } else {
            loginForm.style.display = "none";
            signupForm.style.display = "block";
            formTitle.innerText = "Sign Up for Bizventory";
            toggleForm.innerHTML = `Already have an account? <a href="#">Log In</a>`;
        }
    });

    loginForm.addEventListener('submit', function (e) {
        try{
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            console.log(`Attempting Login with Email: ${email}, Password: ${password}`);
        }catch(error){
            alert('Invalid Credentials Try again please');
        }

    });

    signupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const firstName = document.getElementById('signup-firstname').value;
        const lastName = document.getElementById('signup-lastname').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        console.log(`Signing up: ${firstName} ${lastName} (${email})`);
    });
});
