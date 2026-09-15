// Sign-in via Thunder (the `user-auth` platform-resource dependency), OIDC
// Authorization Code + PKCE. Every other module reaches auth through the
// functions below — never through `userManager` directly — so mock mode can
// substitute this whole module (mock/auth.ts) with no IDP behind it.
import { UserManager, WebStorageStateStore } from "oidc-client-ts";
import { env } from "./env";

export const userManager = new UserManager({
  authority: env.USER_AUTH_ISSUER,
  client_id: env.USER_AUTH_CLIENT_ID,
  redirect_uri: window.location.origin + "/callback",
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope: env.USER_AUTH_SCOPES,
  // The token lives in JS-readable storage — acceptable for a public SPA;
  // keep loadUserInfo:false and lean on the platform CSP.
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  loadUserInfo: false,
});

export async function signIn(): Promise<void> {
  await userManager.signinRedirect();
}

export async function handleCallback() {
  return userManager.signinRedirectCallback();
}

// No end_session_endpoint in Thunder's discovery document, so
// signoutRedirect() rejects — drop the LOCAL session instead and let the
// load-time guard start a fresh sign-in.
export async function signOut(): Promise<void> {
  try {
    await userManager.signoutRedirect();
  } catch {
    await userManager.removeUser();
    window.location.assign("/");
  }
}

// null ONLY when there is no session to renew — an expired one renews
// silently via signinSilent().
export async function currentUser() {
  const user = await userManager.getUser();
  if (user && !user.expired) return user;
  try {
    return await userManager.signinSilent();
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const user = await currentUser();
  return user?.access_token ?? null;
}

/** Roles ride in the ID token as `profile.groups` — never decode the access
 * token and never hand-parse a JWT. */
export async function getRoles(): Promise<string[]> {
  const user = await currentUser();
  const groups = user?.profile?.groups;
  return Array.isArray(groups) ? (groups as string[]) : [];
}
