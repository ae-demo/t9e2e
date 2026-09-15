# t9e2e — PRD

## Problem Statement

Small internal teams tracking day-to-day work often fall back on chat threads
or ad-hoc documents to know what needs doing and what's already done. Nothing
enforces who is allowed to add or close out work, and there is no single place
anyone can check the current state of the team's tasks.

## Solution

t9e2e is a small internal task board: a shared list of tasks that everyone in
the organization can see, with sign-in required to access it. Admins create
tasks and mark them complete; Viewers keep an eye on the board's current
state.

## Actors

- **Viewer** — signs in and sees the full list of tasks and their status
(complete or not). Cannot create or change tasks.
- **Admin** — signs in, sees the full list of tasks, creates new tasks, and
marks tasks complete.

## User Stories

1. As a Viewer, I want to sign in with my organizational account, so that I
can access the task board.
2. As a Viewer, I want to see the full list of tasks and whether each is
complete, so that I know the current state of the team's work.
3. As an Admin, I want to sign in with my organizational account, so that I
can manage tasks.
4. As an Admin, I want to create a new task with a title, so that it appears
on the board for everyone to see.
5. As an Admin, I want to see the full list of tasks and whether each is
complete, so that I can decide what still needs attention.
6. As an Admin, I want to mark a task as complete, so that the board reflects
up-to-date status for everyone.

## Product Decisions

- **Authentication**: sign-in is required for every user; Thunder (the
platform identity provider) handles end-user authentication on both the web
app and the API.
- **Roles**: two roles, Viewer and Admin, as described under Actors.
- **Test users**: the platform seeds a test user for each role (Viewer and
Admin) so the system can be exercised without a real sign-up flow.
- **Task lifecycle**: a task can only be created and later marked complete —
no editing, deleting, or reopening a completed task in this version.
*assumed*
- **Task visibility**: the board is a single shared list — every signed-in
user (Viewer or Admin) sees every task; tasks are not assigned to
individual people. *assumed*
- **Task fields**: a task has a title and its complete/not-complete state
only — no description, due date, or other fields in this version.
*assumed*

## Out of Scope

- Editing or deleting existing tasks.
- Reopening a task once marked complete.
- Assigning tasks to specific people.
- Task descriptions, due dates, priorities, tags, or attachments.
- Multiple boards, teams, or projects — this is a single shared board.
- Notifications or email digests.
- Self-service sign-up — accounts are provisioned by the organization via
Thunder.

## Open Questions

None outstanding.