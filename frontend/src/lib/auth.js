const AUTH_KEY = "urp_authed";

export function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function login() {
  sessionStorage.setItem(AUTH_KEY, "true");
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}
