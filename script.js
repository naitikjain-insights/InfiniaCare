const loginForm = document.getElementById("login-form");

const SUPABASE_URL = "https://csqdkwrpieutiyajofom.supabase.co";

const SUPABASE_ANON_KEY = "YAHAN_APNI_COPIED_ANON_PUBLIC_KEY_PASTE_KARO";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const formMessage = document.getElementById("form-message");
const googleButton = document.getElementById("google-login");
const forgotLink = document.getElementById("forgot-link");

function showMessage(message) {
  formMessage.textContent = message;
  formMessage.hidden = false;
}

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";

  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "Hide" : "Show";
  togglePassword.setAttribute("aria-pressed", String(isPassword));
  togglePassword.setAttribute(
    "aria-label",
    isPassword ? "Hide password" : "Show password"
  );
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }

  showMessage(
    "Your form is ready! Real sign-in will work after we connect authentication."
  );
});

googleButton.addEventListener("click", () => {
  showMessage(
    "Google sign-in will be available after we configure Google authentication."
  );
});

forgotLink.addEventListener("click", (event) => {
  event.preventDefault();

  showMessage(
    "Password recovery will be available after authentication is configured."
  );
});

document.querySelectorAll('a[href="#signup"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    showMessage(
      "Account registration will be added when we build the signup page."
    );
  });
});

document.getElementById("current-year")?.replaceChildren(
  document.createTextNode(String(new Date().getFullYear()))
);
