require("dotenv").config();

const app =
require("./src/app");

const connectDB =
require("./src/config/database");

const PORT = 3000;

// Connect DB

connectDB();

// Start Server

app.listen(PORT, () => {

  console.log(
    `Server running at port ${PORT}`
  );

});