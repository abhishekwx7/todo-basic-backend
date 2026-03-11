const express = require("express");
const bcrypt = require("bcrypt");
const { UserModel, TodoModel } = require("./db");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { z } = require("zod");
const JWT_SECRET = "yoihatemyself";

mongoose.connect(
  "mongodb+srv://abhishekjack44_db_user:XleFqxQrMlHnUajD@cluster0.e2csgpk.mongodb.net/todos-week7-2",
);

const app = express();
app.use(express.json());

app.post("/signup", async function (req, res) {
  const requiredBody = z.object({
    email: z.string().trim().email().max(100),
    password: z.string().min(6),
    name: z.string().min(3).max(100),
  });

  const parsedData = requiredBody.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(400).json({
      message: "Incorrect format",
      error: parsedData.error,
    });
  }

  const { email, password, name } = parsedData.data;

  //  Check if user already exists
  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await UserModel.create({
      email,
      password: hashedPassword,
      name,
    });

    res.json({
      message: "You are signed up!",
    });
  } catch (e) {
    res.status(500).json({
      message: "Server error",
    });
  }
});

app.post("/signin", async function (req, res) {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(403).json({
      message: "User does not exist",
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(403).json({
      message: "Incorrect credentials",
    });
  }

  const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET);

  res.json({ token });
});

app.post("/todo", auth, async function (req, res) {
  const userId = req.userId;
  const title = req.body.title;

  await TodoModel.create({
    title,
    userId,
  });

  res.json({
    message: "Todo created",
  });
});

app.get("/todos", auth, async function (req, res) {
  const userId = req.userId;
  const todos = await TodoModel.find({
    userId: userId,
  });

  res.json({
    todos,
  });
});

function auth(req, res, next) {
  const token = req.headers.token;

  const decodedData = jwt.verify(token, JWT_SECRET);

  if (decodedData) {
    req.userId = decodedData.id;
    next();
  } else {
    res.status(403).json({
      message: "Incorrect Credentials",
    });
  }
}

const server = app.listen(3000, () => {
  console.log("server running");
});

server.on("error", (err) => {
  console.log("error running : ", err.message);
});
