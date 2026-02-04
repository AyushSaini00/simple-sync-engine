import { ObjectId } from "mongodb";

export type Todo = {
  id?: ObjectId;
  title: string;
  completed: boolean;
  createdAt: Date;
};
