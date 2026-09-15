screen TaskBoard "The shared list of tasks and their status"
  navbar "Task Board"
  heading "Tasks"
  row
    text "All tasks on the shared board"
    right
    button "New Task" primary -> NewTask
  table "Title | Status | Created By"
    row "Draft the launch plan | Open | admin"
    row "Set up the database | Done | admin"
    row "Review pull requests | Open | admin"
  text "Admins: select an open task above, then mark it complete"
  row
    right
    button "Mark Complete" // completes the selected task in place; stays on this screen

screen NewTask "Admin creates a new task"
  navbar "Task Board"
  heading "New Task"
  input "Task title"
  row
    right
    button "Cancel" -> TaskBoard
    button "Create" primary -> TaskBoard

flow "View the board"
  role "Viewer"
  description "A Viewer signs in and reviews the current tasks"
  TaskBoard

flow "Manage tasks"
  role "Admin"
  description "An Admin adds a task and marks work complete on the board"
  TaskBoard
  NewTask
