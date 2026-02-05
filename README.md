# Simple Sync Engine

A lightweight real-time synchronization engine for MongoDB and React applications using WebSockets and MongoDB Change Streams.

## Features

- 🔄 **Real-time sync** - Changes propagate instantly to all connected clients
- 📡 **WebSocket-based** - Efficient bidirectional communication
- 🍃 **MongoDB Change Streams** - Native database change detection
- ⚛️ **React hooks** - Familiar API similar to React Query
- 🔌 **Auto-reconnect** - Resilient connection handling
- 📦 **TypeScript** - Full type safety

## Installation

```bash
npm install simple-sync-engine
# or
pnpm add simple-sync-engine
```

## Quick Start

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

## API Reference

### Server

#### `createSimpleSyncEngine(app, db, options?)`

Creates a sync engine instance.

| Parameter      | Type      | Description               |
| -------------- | --------- | ------------------------- |
| `app`          | `Express` | Express application       |
| `db`           | `Db`      | MongoDB database instance |
| `options.port` | `number`  | Default port (3000)       |

**Returns:** `{ server, start(port?), stop() }`

### Client (React)

#### `<SimpleSyncProvider url={string}>`

Context provider for sync functionality.

#### `useSimpleSyncQuery<T>(collection, options?)`

Subscribe to a collection.

**Returns:**

- `data: T[] | undefined` - Current documents
- `loading: boolean` - Initial sync in progress
- `error: Error | null` - Any error
- `refetch: () => void` - Manual refetch

#### `useSimpleSyncMutation<T>(collection)`

Mutate documents in a collection.

**Returns:**

- `mutate(operation)` - Execute mutation
- `loading: boolean` - Mutation in progress
- `error: Error | null` - Any error

**Operations:**

```typescript
// Insert
mutate({ type: "insert", document: { ... } })

// Update
mutate({ type: "update", id: "...", changes: { ... } })

// Delete
mutate({ type: "delete", id: "..." })
```

## Requirements

- MongoDB 4.0+ (Change Streams require replica set)
- Node.js 18+
- React 18+ (for client hooks)

## Example

See the [todo-list example](./examples/todo-list) for a complete working application.

## License

MIT
