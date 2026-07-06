const cors = require("cors");
const allowedOrigins = new Set(["https://app.example.com"]);

app.use(cors({
  origin(origin, callback) {
    callback(null, allowedOrigins.has(origin));
  },
  credentials: false
}));
