// wireframes.dsl: screen TaskBoard — navbar, heading "Tasks", a "New Task"
// button (Admin only), the Title|Status|Created By table, and — for
// Admins — selecting an open task then "Mark Complete" in place.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  ListingTable,
  PageContent,
  PageTitle,
  Stack,
  Typography,
} from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { useAuth } from "../AuthGate";
import { completeTask, listTasks } from "../api";
import type { components } from "../generated/t9e2e-api";

type Task = components["schemas"]["Task"];

export default function TaskBoardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadTasks() {
    setLoadError(null);
    try {
      setTasks(await listTasks());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load tasks");
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function handleMarkComplete() {
    if (!selectedTaskId) return;
    setCompleting(true);
    setActionError(null);
    try {
      await completeTask(selectedTaskId);
      setSelectedTaskId(null);
      await loadTasks();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to complete task");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Tasks</PageTitle.Header>
        <PageTitle.SubHeader>All tasks on the shared board</PageTitle.SubHeader>
        {isAdmin && (
          <PageTitle.Actions>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => navigate({ pathname: "/new-task", search: location.search })}
            >
              New Task
            </Button>
          </PageTitle.Actions>
        )}
      </PageTitle>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      <ListingTable.Container disablePaper>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Title</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
              <ListingTable.Cell>Created By</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {tasks === null ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : tasks.length === 0 ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <ListingTable.EmptyState
                    title="No tasks yet"
                    description="Nothing has been added to the board."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              tasks.map((task) => {
                const selectable = isAdmin && !task.completed;
                const selected = selectedTaskId === task.id;
                return (
                  <ListingTable.Row
                    key={task.id}
                    clickable={selectable}
                    onClick={
                      selectable
                        ? () => setSelectedTaskId(selected ? null : task.id)
                        : undefined
                    }
                    sx={selected ? { bgcolor: "action.selected" } : undefined}
                  >
                    <ListingTable.Cell>{task.title}</ListingTable.Cell>
                    <ListingTable.Cell>
                      <Chip
                        label={task.completed ? "Done" : "Open"}
                        color={task.completed ? "success" : "warning"}
                        size="small"
                      />
                    </ListingTable.Cell>
                    <ListingTable.Cell>{task.createdBy}</ListingTable.Cell>
                  </ListingTable.Row>
                );
              })
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>

      {isAdmin && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Admins: select an open task above, then mark it complete
          </Typography>
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              disabled={!selectedTaskId || completing}
              onClick={() => void handleMarkComplete()}
            >
              Mark Complete
            </Button>
          </Stack>
        </>
      )}
    </PageContent>
  );
}
