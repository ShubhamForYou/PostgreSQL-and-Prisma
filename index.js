import express from "express";
import "dotenv/config";
import prisma from "./db.js";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// @desc register a new user
// @route POST /register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// @desc Login a user
// @route POST /login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password (in a real application, you should hash and compare passwords)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// @desc Fetch all users
// @route GET /all/user
app.get("/all/user", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            description: true,
            comment_count: true,
          },
        },

        _count: {
          select: {
            posts: true, // Include count of posts for
          },
        },
      },
      
    });
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @desc Fetch all posts
// @route GET /all/post
app.get("/all/post", async (req, res) => {
  try {
    const posts = await prisma.post.findMany();
    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: "No posts found" });
    }
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @desc Create a new post
// @route POST /create/post
app.post("/create/post", async (req, res) => {
  const { user_id, title, description } = req.body;
  if (!user_id || !title || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // Validate user_id
  const user = await prisma.user.findUnique({
    where: { id: user_id },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // Create the post
  try {
    const newPost = await prisma.post.create({
      data: {
        user_id: user_id,
        title: title,
        description: description,
      },
    });
    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @desc Fetch a single post by ID
// @route GET /detail/post
app.get("/detail/post", async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: "Post ID is required" });
  }
  try {
    const post = await prisma.post.findUnique({
      where: { id: id },
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @desc Update a post
// @route PUT /update/post
app.put("/update/post", async (req, res) => {
  const { id } = req.query;
  const data = req.body;
  if (!id) {
    return res.status(400).json({ message: "Post ID is required" });
  }

  try {
    const updatedPost = await prisma.post.update({
      where: { id: id },
      data: data,
    });
    res
      .status(200)
      .json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @desc Delete a post
// @route DELETE /delete/post
app.delete("/delete/post", async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: "Post ID is required" });
  }
  try {
    const deletedPost = await prisma.post.delete({
      where: { id: id },
    });
    res
      .status(200)
      .json({ message: "Post deleted successfully", post: deletedPost });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// route not found
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  //   prisma connection

  prisma
    .$connect()
    .then(() => {
      console.log("Connected to the database successfully");
      console.log(`Database URL: ${process.env.DATABASE_URL}`);
    })
    .catch((error) => {
      console.error("Error connecting to the database:", error);
    });
});
