# Domain Model

The task board's data is a single entity: a task, created by an Admin and
later marked complete.

```mermaid
erDiagram
    TASK {
        string id PK
        string title
        boolean completed
        string createdBy
        datetime createdAt
        datetime completedAt
    }
```

- `createdBy` records the Admin's user id from the sign-in token.
- `completedAt` is null until an Admin marks the task complete.

