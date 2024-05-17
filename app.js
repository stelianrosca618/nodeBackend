require("dotenv").config();

const express = require("express");
const app = express();

require("./config/middleware.config")(app);

//Aquí van los require de las rutas
const authRoutes = require("./routes/auth.routes");

const port = process.env.PORT || 4000;

app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log("server runnning :>>", port);
});
