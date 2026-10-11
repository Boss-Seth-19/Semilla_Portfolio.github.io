const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve the files inside the public folder
app.use(express.static(path.join(__dirname, "public")));

// Serve project files
app.use("/projects", express.static(path.join(__dirname, "projects")));

// Start the server
app.listen(PORT, () => {
    console.log(`Portfolio running at http://localhost:${PORT}`);
});