
const SUPABASE_URL = "https://csqdkwrpieutiyajofom.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_GrNhZqa5xPrXRURbwcTF4g_u5PjSWPS";

if (!window.supabase) {
  document.body.textContent =
    "InfiniaCare could not load authentication. Please refresh the page.";
  throw new Error("Supabase library failed to load.");
}

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm-password");
const confirmGroup = document.getElementById("confirm-group");
const togglePassword = document.getElementById("toggle-password");
const toggleConfirm = document.getElementById("toggle-confirm");
const formMessage = document.getElementById("form-message");
const googleButton = document.getElementById("google-login");
const forgotLink = document.getElementById("forgot-link");
const rememberMe = document.getElementById("remember-me");
const rememberOption = document.getElementById("remember-option");
const separator = document.getElementById("separator");
const topPrompt = document.getElementById("top-prompt");
const topModeLink = document.getElementById("top-mode-link");
const bottomPrompt = document.getElementById("bottom-prompt");
const modeLink = document.getElementById("mode-link");
const formKicker = document.getElementById("form-kicker");
const formTitle = document.getElementById("form-title");
const formSubtitle = document.getElementById("form-subtitle");
const passwordLabel = document.getElementById("password-label");
const submitLabel = document.getElementById("submit-label");
const formFooter = document.getElementById("form-footer");

let mode = "login";

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.hidden = false;
  formMessage.setAttribute("role", isError ? "alert" : "status");
}

function clearMessage() {
  formMessage.textContent = "";
  formMessage.hidden = true;
  formMessage.setAttribute("role", "status");
}

function getEmail() {
  return emailInput.value.trim().toLowerCase();
}

function setLoading(loading) {
  const button = document.getElementById("submit-button");
  button.disabled = loading;
  submitLabel.textContent = loading ? "Please wait..." : (
    mode === "signup" ? "Create account" :
    mode === "recovery" ? "Update password" : "Sign in"
  );
}

function setMode(nextMode) {
  mode = nextMode;
  clearMessage();

  const signup = mode === "signup";
  const recovery = mode === "recovery";
  const login = mode === "login";

  formKicker.textContent = recovery
    ? "SECURE YOUR ACCOUNT"
    : signup ? "GET STARTED" : "WELCOME BACK";

  formTitle.textContent = recovery
    ? "Create a new password"
    : signup ? "Create your InfiniaCare account" : "Sign in to InfiniaCare";

  formSubtitle.textContent = recovery
    ? "Choose a new password for your account."
    : signup
      ? "Create an account to begin your wellness journey."
      : "Enter your details to continue.";

  passwordLabel.textContent = recovery ? "New password" : "Password";
  passwordInput.placeholder = recovery
    ? "Enter a new password"
    : signup ? "Create a password" : "Enter your password";
  passwordInput.autocomplete = signup || recovery
    ? "new-password" : "current-password";
  passwordInput.value = "";
  passwordInput.required = true;

  confirmGroup.hidden = !(signup || recovery);
  confirmInput.disabled = !(signup || recovery);
  confirmInput.required = signup || recovery;
  confirmInput.value = "";

  togglePassword.textContent = "Show";
  passwordInput.type = "password";
  togglePassword.setAttribute("aria-pressed", "false");
  toggleConfirm.textContent = "Show";
  confirmInput.type = "password";
  toggleConfirm.setAttribute("aria-pressed", "false");

  forgotLink.hidden = !login;
  rememberOption.hidden = !login;
  separator.hidden = recovery;
  googleButton.hidden = recovery;
  topPrompt.hidden = recovery;
  topModeLink.hidden = recovery;
  bottomPrompt.hidden = recovery;
  modeLink.hidden = recovery;
  formFooter.hidden = recovery;

  if (signup) {
    topPrompt.textContent = "Already registered?";
    topModeLink.textContent = "Sign in";
    topModeLink.href = "#login";
    bottomPrompt.textContent = "Already have an account?";
    modeLink.textContent = "Sign in";
    modeLink.href = "#login";
  } else if (login) {
    topPrompt.textContent = "New here?";
    topModeLink.textContent = "Create account";
    topModeLink.href = "#signup";
    bottomPrompt.textContent = "Don't have an account?";
    modeLink.textContent = "Sign up";
    modeLink.href = "#signup";
  }

  submitLabel.textContent = recovery
    ? "Update password"
    : signup ? "Create account" : "Sign in";
}

function toggleVisibility(input, button) {
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.textContent = show ? "Hide" : "Show";
  button.setAttribute("aria-pressed", String(show));
}

togglePassword.addEventListener("click", () => {
  toggleVisibility(passwordInput, togglePassword);
});

toggleConfirm.addEventListener("click", () => {
  toggleVisibility(confirmInput, toggleConfirm);
});

topModeLink.addEventListener("click", (event) => {
  event.preventDefault();
  setMode(mode === "signup" ? "login" : "signup");
});

modeLink.addEventListener("click", (event) => {
  event.preventDefault();
  setMode(mode === "signup" ? "login" : "signup");
});

// Supabase persists sessions securely in browser storage.
// Remember Me is retained as a preference; Supabase's default
// browser storage keeps sessions across reloads.
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }

  const email = getEmail();
  const password = passwordInput.value;

  if ((mode === "signup" || mode === "recovery") &&
      password !== confirmInput.value) {
    showMessage("The passwords do not match. Please check and try again.", true);
    confirmInput.focus();
    return;
  }

  if ((mode === "signup" || mode === "recovery") && password.length < 8) {
    showMessage("Please use a password with at least 8 characters.", true);
    passwordInput.focus();
    return;
  }

  setLoading(true);

  try {
    if (mode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + window.location.pathname
        }
      });

      if (error) throw error;

      if (data.session) {
        showMessage("Your account has been created. Welcome to InfiniaCare!");
      } else {
        showMessage(
          "Signup started! Check your email for the verification link before signing in."
        );
        setMode("login");
      }
    } else if (mode === "recovery") {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) throw error;

      await supabaseClient.auth.signOut();
      setMode("login");
      showMessage("Password updated successfully. You can now sign in.");
    } else {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({ email, password });

      if (error) throw error;

      showMessage("Login successful! Welcome to InfiniaCare.");
      console.log("Signed-in user ID:", data.user?.id);
    }
  } catch (error) {
    showMessage(
      error.message || "Something went wrong. Please try again.",
      true
    );
  } finally {
    setLoading(false);
  }
});

forgotLink.addEventListener("click", async (event) => {
  event.preventDefault();
  clearMessage();

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
      "If an account exists for this email, a password reset link will be sent."
    );
  } catch (error) {
    showMessage(error.message || "Could not send the reset email.", true);
  }
});

googleButton.addEventListener("click", async () => {
  clearMessage();

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
      "Google sign-in is not configured yet. Please try another sign-in method.",
      true
    );
  }
});

// Supabase redirects back here with a recovery session.
supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    setMode("recovery");
    showMessage("Choose and confirm your new password.");
  }
});

document.getElementById("current-year")?.replaceChildren(
  document.createTextNode(String(new Date().getFullYear()))
);
