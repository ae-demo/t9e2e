// window._env_ for mock mode — exactly the keys this app declares in
// src/env.ts (the USER_AUTH platform-resource dependency's OIDC config).
// Never a sibling API address — that is same-origin /api, not a browser key.
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  USER_AUTH_JWKS_URL: "https://mock-idp.test/.well-known/jwks.json",
  USER_AUTH_SCOPES: "openid profile email group ou",
};
