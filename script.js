
const SUPABASE_URL = "https://csqdkwrpieutiyajofom.supabase.co";

// Replace this placeholder with your Supabase publishable key
// or legacy anon public key. Never use a service_role/secret key.
const SUPABASE_ANON_KEY = "sb_publishable_GrNhZqa5xPrXRURbwcTF4g_u5PjSWPS";
if (!window.supabase) {
  throw new Error("Supabase library did not load. Please refresh the page.");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const formMessage = document.getElementById("form-message");
const googleButton = document.getElementById("google-login");
const forgotLink = document.getElementById("forgot-link");
const rememberMe = document.getElementById("remember-me");

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.hidden = false;
  formMessage.setAttribute("role", isError ? "alert" : "status");
}

function setLoading(isLoading) {
  const submitButton = loginForm.querySelector('button[type="submit"]');

  submitButton.disabled = isLoading;
  submitButton.querySelector("span").textContent = isLoading
    ? "Please wait..."
    : "Sign in";
}

function getEmail() {
  return emailInput.value.trim().toLowerCase();
}

// Remember me: persist the session in local storage when checked.
// Otherwise, keep the session in session storage for this browser tab.
const originalFetch = window.fetch.bind(window);

const authStorage = {
  getItem(key) {
    try {
      return (rememberMe?.checked ? localStorage : sessionStorage).getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      (rememberMe?.checked ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      // Storage may be unavailable in private browsing.
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
  }
};

// Recreate the client with the selected storage behaviour.
const authClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: originalFetch
    }
  }
);

togglePassword.addEventListener("click", () => {
  const show = passwordInput.type === "password";

  passwordInput.type = show ? "text" : "password";
  togglePassword.textContent = show ? "Hide" : "Show";
  togglePassword.setAttribute("aria-pressed", String(show));
  togglePassword.setAttribute(
    "aria-label",
    show ? "Hide password" : "Show password"
  );
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }

  if (
    !SUPABASE_ANON_KEY ||
    SUPABASE_ANON_KEY === "PASTE_YOUR_SUPABASE_PUBLIC_KEY_HERE"
  ) {
    showMessage("Please add your Supabase public key in script.js first.", true);
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await authClient.auth.signInWithPassword({
      email: getEmail(),
      password: passwordInput.value
    });

    if (error) throw error;

    showMessage("Login successful! Welcome to InfiniaCare.");

    // Later we can redirect to the authenticated dashboard.
    console.log("Signed-in user:", data.user?.id);
  } catch (error) {
    showMessage(error.message || "Login failed. Please try again.", true);
  } finally {
    setLoading(false);
  }
});

googleButton.addEventListener("click", async () => {
  try {
    if (
      !SUPABASE_ANON_KEY ||
      SUPABASE_ANON_KEY === "PASTE_YOUR_SUPABASE_PUBLIC_KEY_HERE"
    ) {
      showMessage("Please add your Supabase public key first.", true);
      return;
    }

    const { error } = await authClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });

    if (error) throw error;
  } catch (error) {
    showMessage(
      error.message || "Google sign-in could not be started.",
      true
    );
  }
});

forgotLink.addEventListener("click", async (event) => {
  event.preventDefault();

  const email = getEmail();

  if (!email) {
    showMessage("Enter your email address first, then click Forgot password.", true);
    emailInput.focus();
    return;
  }

  try {
    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    if (error) throw error;

    showMessage("If an account exists for this email, a password reset email will be sent.");
  } catch (error) {
    showMessage(error.message || "Could not send the password reset email.", true);
  }
});

document.querySelectorAll('a[href="#signup"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showMessage(
      "Signup form is not available yet. We'll add the registration screen next."
    );
  });
});

document.getElementById("current-year")?.replaceChildren(
  document.createTextNode(String(new Date().getFullYear()))
);
