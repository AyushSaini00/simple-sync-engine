import { useState } from "react";
import type { Todo } from "./types.js";
import {
  useSimpleSyncQuery as useQuery,
  useSimpleSyncMutation as useMutation,
} from "simple-sync-engine/client/react";

function App() {
  const [newTodo, setNewTodo] = useState("");

  // use sync hook instead of manual fetch
  const { data: todos, loading } = useQuery<Todo>("todos");
  const { mutate } = useMutation<Todo>("todos");

  const todoList = todos || [];

  const addTodo = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!newTodo.trim()) return;

    // use sync mutation - this will broadcast to all the clients
    mutate({
      type: "insert",
      document: {
        title: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      },
    });

    setNewTodo("");
  };

  const toggleTodo = (todo: Todo) => {
    mutate({
      type: "update",
      id: todo._id,
      changes: { completed: !todo.completed },
    });
  };

  const deleteTodo = (todoId: string) => {
    mutate({
      type: "delete",
      id: todoId,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Tasks</h1>

        {/* Todo List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-4 text-gray-500 text-sm">Loading...</div>
          ) : todoList.length === 0 ? (
            <div className="p-4 text-gray-400 text-sm">
              No tasks yet. Add one below.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {todoList.map((todo) => (
                <li
                  key={todo._id}
                  className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50 transition-colors"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  {/* Title */}
                  <span
                    className={`flex-1 text-sm ${
                      todo.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-700"
                    }`}
                  >
                    {todo.title}
                  </span>
                  {/* Delete button */}
                  <button
                    onClick={() => deleteTodo(todo._id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-sm"
                    aria-label="Delete task"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add Todo Input - at the bottom */}
          <form
            onSubmit={addTodo}
            className="border-t border-gray-200 px-4 py-3"
          >
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..."
              className="w-full text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
            />
          </form>
        </div>

        {/* Footer hint */}
        <p className="mt-3 text-xs text-gray-400 text-center">
          Press Enter to add a task
        </p>
      </div>
    </div>
  );
}

export default App;
