const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const generateRoute = require("./routes/generate");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use("/", generateRoute);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let lastGenerationTimestamp = 0;

function logEvent(type, details) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event: type,
      details
    })
  );
}

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
