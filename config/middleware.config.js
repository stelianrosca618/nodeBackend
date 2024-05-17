require("dotenv").config();
// const {
//     myBrowsingRestriction,
//   } = require("../middlewares/myBrowsingRestriction");
//   const compression = require("compression");

const bodyParser = require("body-parser");
const cors = require("cors");

const origin = process.env.DOMAIN;

const corsConfig = { origin: [origin], credentials: true };

module.exports = (app) => {
  app.use(cors(corsConfig));
  app.use(bodyParser.json({ limit: "5mb" }));
  app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));
  // app.use(compression());
  // app.use(myBrowsingRestriction);
};
