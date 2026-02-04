import * as dotenv from "dotenv";
import app from "./server.js";
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server running on PORT : ${PORT}`);
});
