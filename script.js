
const SUPABASE_URL = "https://csqdkwrpieutiyajofom.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_GrNhZqa5xPrXRURbwcTF4g_u5PjSWPS";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const formMessage = document.getElementById("form-message");
const googleButton = document.getElementById("google-login");
const forgotLink = document.getElementById("forgot-link");
const rememberMe = document.getElementById("remember-me");

if (!window.supabase) {
  throw new Error("Supabase library failed to load. Please refresh the page.");
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.hidden = false;
  formMessage.setAttribute("role", isError ? "alert" : "status");
}

function getEmail() {
  return emailInput.value.trim().toLowerCase();
}

// Remember Me storage: use localStorage when checked,
// otherwise use sessionStorage.
const authStorage = {
  getItem(key) {
    try {
      return (
        localStorage.getItem(key) ??
        sessionStorage.getItem(key)
      );
    } catch {
      return null;
    }
  },

  setItem(key, value) {
    try {
      if (rememberMe?.checked) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch {
      // Browser storage may be unavailable.
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

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

function setLoading(isLoading) {
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = isLoading;
  button.querySelector("span").textContent =
    isLoading ? "Please wait..." : "Sign in";
}

// Show or hide password.
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

// Real email and password login.
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: getEmail(),
      password: passwordInput.value
    });

    if (error) throw error;

    showMessage("Login successful! Welcome to InfiniaCare.");
    console.log("Signed-in user ID:", data.user?.id);
  } catch (error) {
    showMessage(
      error.message || "Login failed. Please check your details and try again.",
      true
    );
  } finally {
    setLoading(false);
  }
});

// Password reset email.
forgotLink.addEventListener("click", async (event) => {
  event.preventDefault();

  const email = getEmail();

  if (!email) {
    showMessage("Enter your email address first, then click Forgot password.");
    emailInput.focus();
    return;
  }

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    if (error) throw error;

    showMessage(
      "If an account exists for this email, a password reset email will be sent."
    );
  } catch (error) {
    showMessage(error.message || "Could not send the reset email.", true);
  }
});

// Google OAuth. Google must first be configured in Supabase.
googleButton.addEventListener("click", async () => {
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });

    if (error) throw error;
  } catch (error) {
    showMessage(
      error.message ||
        "Google sign-in is not configured yet. Please try again later.",
      true
    );
  }
});

// Signup UI will be added in a later step.
document.querySelectorAll('a[href="#signup"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showMessage("The signup form will be added in the next step.");
  });
});

// Current year, if the element exists.
document.getElementById("current-year")?.replaceChildren(
  document.createTextNode(String(new Date().getFullYear()))
);
