const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
require("dotenv").config();

const port = process.env.PORT || 9000;

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define a route to handle saving messages
app.post("/save-message", async (req, res) => {
  try {
    const { user_message } = req.body;

    // Insert the message into the database
    const [result] = await db.execute(
      "INSERT INTO chat_app_db (chat_id, chat_msg) VALUES (NULL, ?)",
      [user_message],
    );
    console.log("Query result:", result);
    if (result.affectedRows === 1) {
      res.status(200).json({ message: "Message saved successfully", user_message });
    } else {
      console.error("Error saving message:", result.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// http://localhost:9000
// node server.js

