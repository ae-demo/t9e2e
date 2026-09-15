// wireframes.dsl: screen NewTask — navbar, heading "New Task", a title
// input, Cancel -> TaskBoard, Create -> TaskBoard.
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Alert, Button, Form, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { useAuth } from "../AuthGate";
import { createTask } from "../api";

export default function NewTaskPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only Admins create tasks (specs/design/security.json). A Viewer who
  // lands here directly (rather than through the hidden "New Task" button)
  // is sent back to the board instead of shown a form they cannot submit.
  if (!isAdmin) {
    return <Navigate to={{ pathname: "/", search: location.search }} replace />;
  }

  async function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await createTask(trimmed);
      navigate({ pathname: "/", search: location.search });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>New Task</PageTitle.Header>
      </PageTitle>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Form.Section>
        <Form.Stack>
          <TextField
            label="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
        </Form.Stack>
      </Form.Section>

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate({ pathname: "/", search: location.search })}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!title.trim() || submitting}
          onClick={() => void handleCreate()}
        >
          Create
        </Button>
      </Stack>
    </PageContent>
  );
}
