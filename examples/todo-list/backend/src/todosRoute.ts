import { Router } from "express";
import type { Request, Response } from "express";
import db from "./db.js";
import type { Todo } from "./types.js";
import { Collection, ObjectId } from "mongodb";

const router: Router = Router();

// Get all todos
router.get("/", async (req: Request, res: Response) => {
  try {
    const todosCollection: Collection<Todo> = await db.collection("todos");
    const todos = await todosCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(todos);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch todos",
    });
  }
});

// Create a new todo
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const newTodo: Todo = {
      title: title.trim(),
      completed: false,
      createdAt: new Date(),
    };

    const todosCollection: Collection<Todo> = await db.collection("todos");
    const result = await todosCollection.insertOne(newTodo);
    const insertedTodo = await todosCollection.findOne({
      _id: result.insertedId,
    });
    res.status(201).json(insertedTodo);
  } catch (error) {
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Toggle todo completion
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { completed } = req.body;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid todo ID" });
      return;
    }

    const todosCollection: Collection<Todo> = await db.collection("todos");
    const result = await todosCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { completed } },
      { returnDocument: "after" }
    );

    if (!result) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// Delete a todo
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid todo ID" });
      return;
    }

    const todosCollection: Collection<Todo> = await db.collection("todos");
    const result = await todosCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

export default router;
