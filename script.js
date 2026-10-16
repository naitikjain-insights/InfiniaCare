
const SUPABASE_URL = "https://csqdkwrpieutiyajofom.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_GrNhZqa5xPrXRURbwcTF4g_u5PjSWPS";

if (!window.supabase) {
  document.body.textContent =
    "InfiniaCare could not load authentication. Please refresh the page.";
  throw new Error("Supabase library failed to load.");
}

const $ = (id) => document.getElementById(id);

const loginForm = $("login-form");
const emailInput = $("email");
const passwordInput = $("password");
const confirmInput = $("confirm-password");
const confirmGroup = $("confirm-group");
const togglePassword = $("toggle-password");
const toggleConfirm = $("toggle-confirm");
const formMessage = $("form-message");
const googleButton = $("google-login");
const forgotLink = $("forgot-link");
const rememberOption = $("remember-option");
const separator = $("separator");
const topPrompt = $("top-prompt");
const topModeLink = $("top-mode-link");
const bottomPrompt = $("bottom-prompt");
const modeLink = $("mode-link");
const formKicker = $("form-kicker");
const formTitle = $("form-title");
const formSubtitle = $("form-subtitle");
const passwordLabel = $("password-label");
const submitLabel = $("submit-label");
const formFooter = $("form-footer");
const authScreen = $("auth-screen");
const portalSelection = $("portal-selection");

let mode = "login";
let authRequestInProgress = false;

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

function getSelectedPortal() {
  return sessionStorage.getItem("infinia_selected_portal");
}

function getEmail() {
  return emailInput.value.trim().toLowerCase();
}

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

function setLoading(loading) {
  const button = $("submit-button");
  if (button) button.disabled = loading;

  if (submitLabel) {
    submitLabel.textContent = loading
      ? "Please wait..."
      : mode === "signup"
        ? "Create account"
        : mode === "recovery"
          ? "Update password"
          : "Sign in";
  }
}

function setMode(nextMode) {
  mode = nextMode;
  clearMessage();

  const signup = mode === "signup";
  const recovery = mode === "recovery";
  const login = mode === "login";

  formKicker.textContent = recovery
    ? "SECURE YOUR ACCOUNT"
    : signup
      ? "GET STARTED"
      : "WELCOME BACK";

  formTitle.textContent = recovery
    ? "Create a new password"
    : signup
      ? "Create your InfiniaCare account"
      : "Sign in to InfiniaCare";

  formSubtitle.textContent = recovery
    ? "Choose a new password for your account."
    : signup
      ? "Create an account to begin your wellness journey."
      : "Enter your details to continue.";

  passwordLabel.textContent = recovery ? "New password" : "Password";
  passwordInput.placeholder = recovery
    ? "Enter a new password"
    : signup
      ? "Create a password"
      : "Enter your password";

  passwordInput.autocomplete =
    signup || recovery ? "new-password" : "current-password";

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

  setLoading(false);
}

function toggleVisibility(input, button) {
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.textContent = show ? "Hide" : "Show";
  button.setAttribute("aria-pressed", String(show));
}

function openPortalForRecovery() {
  let portal = getSelectedPortal();

  if (portal !== "patient" && portal !== "doctor") {
    portal = "patient";
    sessionStorage.setItem("infinia_selected_portal", portal);
  }

  if (authScreen && portalSelection && authScreen.hidden) {
    const portalButton = document.querySelector(
      `[data-portal="${portal}"]`
    );

    if (portalButton) {
      portalButton.click();
    } else {
      portalSelection.hidden = true;
      authScreen.hidden = false;
    }
  }
}

async function verifyPortalAccess(user) {
  const selectedPortal = getSelectedPortal();

  if (selectedPortal !== "patient" && selectedPortal !== "doctor") {
    await supabaseClient.auth.signOut();
    showMessage(
      "Please choose Patient or Doctor portal, then sign in again.",
      true
    );
    return false;
  }

  let profile;
  let profileError;

  try {
    const result = await supabaseClient
      .from("profiles")
      .select("role, doctor_approved")
      .eq("id", user.id)
      .maybeSingle();

    profile = result.data;
    profileError = result.error;
  } catch (error) {
    profileError = error;
  }

  if (profileError || !profile) {
    await supabaseClient.auth.signOut();
    showMessage(
      "We couldn't verify your account role. Please try again or contact support.",
      true
    );
    return false;
  }

  if (selectedPortal === "patient" && profile.role !== "patient") {
    await supabaseClient.auth.signOut();
    showMessage(
      "This account is not registered as a Patient account. Please choose the correct portal.",
      true
    );
    return false;
  }

  if (selectedPortal === "doctor") {
    if (profile.role !== "doctor") {
      await supabaseClient.auth.signOut();
      showMessage(
        "This account does not have Doctor access yet. Doctor registration and approval are required.",
        true
      );
      return false;
    }

    if (profile.doctor_approved !== true) {
      await supabaseClient.auth.signOut();
      showMessage(
        "Your Doctor account has not been approved yet. Please contact the InfiniaCare administrator.",
        true
      );
      return false;
    }
  }

  return true;
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

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (authRequestInProgress) return;

  clearMessage();

  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }

  const selectedPortal = getSelectedPortal();

  if (selectedPortal !== "patient" && selectedPortal !== "doctor") {
    showMessage("Please choose a portal before continuing.", true);
    return;
  }

  const email = getEmail();
  const password = passwordInput.value;

  if (
    (mode === "signup" || mode === "recovery") &&
    password !== confirmInput.value
  ) {
    showMessage(
      "The passwords do not match. Please check and try again.",
      true
    );
    confirmInput.focus();
    return;
  }

  if (
    (mode === "signup" || mode === "recovery") &&
    password.length < 8
  ) {
    showMessage(
      "Please use a password with at least 8 characters.",
      true
    );
    passwordInput.focus();
    return;
  }

  // Doctor registration must not grant Doctor privileges automatically.
  // A verified Doctor onboarding process needs to be configured first.
  if (mode === "signup" && selectedPortal === "doctor") {
    showMessage(
      "Doctor registration is not open yet. Doctor accounts must be verified and approved by the InfiniaCare administrator. You can sign in here if you already have an approved Doctor account.",
      true
    );
    return;
  }

  authRequestInProgress = true;
  setLoading(true);

  try {
    if (mode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            window.location.origin + window.location.pathname
        }
      });

      if (error) throw error;

      if (data.session && data.user) {
        const allowed = await verifyPortalAccess(data.user);

        if (allowed) {
          showMessage(
            "Your Patient account has been created successfully."
          );
        }
      } else {
        setMode("login");
        showMessage(
          "Signup started! Check your email for the verification link before signing in."
        );
      }
    } else if (mode === "recovery") {
      const { error } = await supabaseClient.auth.updateUser({
        password
      });

      if (error) throw error;

      await supabaseClient.auth.signOut();
      setMode("login");
      showMessage(
        "Password updated successfully. You can now sign in."
      );
    } else {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      const allowed = await verifyPortalAccess(data.user);

      if (allowed) {
        showMessage(
          selectedPortal === "doctor"
            ? "Doctor login successful. Your approved account has been verified."
            : "Patient login successful. Welcome to InfiniaCare!"
        );

        // Dashboard navigation will be added once the protected
        // dashboard pages and their access guards are ready.
      }
    }
  } catch (error) {
    showMessage(
      error.message || "Something went wrong. Please try again.",
      true
    );
  } finally {
    authRequestInProgress = false;
    setLoading(false);
  }
});

forgotLink.addEventListener("click", async (event) => {
  event.preventDefault();
  clearMessage();

  const email = getEmail();

  if (!email) {
    showMessage(
      "Enter your email address first, then click Forgot password."
    );
    emailInput.focus();
    return;
  }

  try {
    const { error } =
      await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo:
          window.location.origin + window.location.pathname
      });

    if (error) throw error;

    showMessage(
      "If an account exists for this email, a password reset link will be sent."
    );
  } catch (error) {
    showMessage(
      error.message || "Could not send the reset email.",
      true
    );
  }
});

googleButton.addEventListener("click", async () => {
  clearMessage();

  const selectedPortal = getSelectedPortal();

  if (selectedPortal !== "patient" && selectedPortal !== "doctor") {
    showMessage("Please choose a portal before continuing.", true);
    return;
  }

  try {
    sessionStorage.setItem("infinia_oauth_pending", "true");

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin + window.location.pathname
      }
    });

    if (error) throw error;
  } catch (error) {
    sessionStorage.removeItem("infinia_oauth_pending");
    showMessage(
      error.message ||
        "Google sign-in is not configured yet. Please try another sign-in method.",
      true
    );
  }
});

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    openPortalForRecovery();
    setMode("recovery");
    showMessage("Choose and confirm your new password.");
    return;
  }

  // Google OAuth returns to this page after authentication.
  if (
    event === "SIGNED_IN" &&
    session?.user &&
    sessionStorage.getItem("infinia_oauth_pending") === "true"
  ) {
    sessionStorage.removeItem("infinia_oauth_pending");

    void (async () => {
      const allowed = await verifyPortalAccess(session.user);

      if (allowed) {
        showMessage(
          getSelectedPortal() === "doctor"
            ? "Doctor login successful. Your approved account has been verified."
            : "Patient login successful. Welcome to InfiniaCare!"
        );
      }
    })();
  }
});

$("current-year")?.replaceChildren(
  document.createTextNode(String(new Date().getFullYear()))
);
