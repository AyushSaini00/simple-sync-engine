import { useState } from "react";
import type { Todo } from "./types.js";
import {
  useSimpleSyncQuery as useQuery,
  useSimpleSyncMutation as useMutation,
} from "../../../../src/client/react/index.js";

function App() {
  const [newTodo, setNewTodo] = useState("");

  const { data: todos, loading } = useQuery<Todo>("todos");
  const { mutate } = useMutation<Todo>("todos");

  const todoList = todos || [];

  const addTodo = (evt) => {
    evt.preventDefault();

    if (!newTodo.trim()) return;

    setNewTodo("");
  };

  return (
    <div>
      <div>
        <form onSubmit={addTodo}>
          <div>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="What needs to be done?"
            />
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : todoList.length === 0 ? (
            <div>No todos yet! Add your first task</div>
          ) : (
            <div>
              {todoList.map((todo) => {
                return (
                  <div key={todo._id}>
                    <span>{todo.title}</span>
                  </div>
                );
              })}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default App;
