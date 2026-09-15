// Gates the signed-in app on Thunder sign-in — no `Login` screen exists (the
// wireframes deliberately draw none): an unauthenticated visitor is redirected
// straight to Thunder and lands back on the board once signed in.
//
// Role is read from the ID token's `profile.groups` (thunder-authentication)
// and is presentation-only here — the backend is the one that enforces it and
// answers 403. A caller whose groups match no declared role gets this design's
// coldStartRole (`specs/design/security.json`), which is "Viewer": the base,
// read-only experience.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Box, CircularProgress } from "@wso2/oxygen-ui";
import { currentUser, getRoles, signIn } from "./auth";

export interface AuthState {
  name: string;
  email: string;
  roles: string[];
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function resolveIsAdmin(roles: string[]): boolean {
  return roles.some((role) => role.toLowerCase().includes("admin"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const user = await currentUser();
      if (!user) {
        // Not merely expired — currentUser() already renews silently. No
        // session at all means a fresh sign-in, via a full redirect.
        await signIn();
        return;
      }
      const roles = await getRoles();
      if (cancelled) return;
      setState({
        name: user.profile.name ?? user.profile.email ?? "Signed in",
        email: user.profile.email ?? "",
        roles,
        isAdmin: resolveIsAdmin(roles),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
