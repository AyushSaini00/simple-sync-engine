# Simple Sync Engine

A simple sync engine for MongoDB and React apps.

## Installation

```bash
npm install simple-sync-engine
```

## Usage

### Server Setup

```typescript
import express from "express";
import { MongoClient } from "mongodb";
import { createSimpleSyncEngine } from "simple-sync-engine/server";

const app = express();
const client = await MongoClient.connect(process.env.MONGO_URI);
const db = client.db("myapp");

const sync = createSimpleSyncEngine(app, db);
sync.start(3000);
```

### Client Setup (React)

```tsx
import { SimpleSyncProvider } from "simple-sync-engine/client/react";

function App() {
  return (
    <SimpleSyncProvider url="ws://localhost:3000/sync">
      <TodoList />
    </SimpleSyncProvider>
  );
}
```

### Using Hooks

```tsx
import {
  useSimpleSyncQuery,
  useSimpleSyncMutation,
} from "simple-sync-engine/client/react";

function TodoList() {
  const { data: todos, loading } = useSimpleSyncQuery<Todo>("todos");
  const { mutate } = useSimpleSyncMutation<Todo>("todos");

  const addTodo = (title: string) => {
    mutate({
      type: "insert",
      document: { title, completed: false },
    });
  };

  const toggleTodo = (id: string, completed: boolean) => {
    mutate({
      type: "update",
      id,
      changes: { completed: !completed },
    });
  };

  const deleteTodo = (id: string) => {
    mutate({ type: "delete", id });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo._id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo._id, todo.completed)}
          />
          {todo.title}
          <button onClick={() => deleteTodo(todo._id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

## Example

See the [todo-list example](./examples/todo-list) for a complete working demo.
