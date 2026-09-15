// The redirect target Thunder returns to after sign-in
// (`window.location.origin + "/callback"`). Not one of the wireframe's
// screens — the platform's SSO hosts sign-in itself; this route only
// completes the OIDC code exchange and lands the user back on the board.
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Box, CircularProgress } from "@wso2/oxygen-ui";
import { handleCallback } from "../auth";

export default function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      try {
        await handleCallback();
      } finally {
        navigate("/", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <CircularProgress />
    </Box>
  );
}
