const express = require("express"),
  morgan = require("morgan"),
  fs = require("fs"),
  path = require("path"),
  movies = require("./movies.json");

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
});

app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.static("public"));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Error");
});

app.get("/movies", (req, res) => {
  res.json(movies);
});
app.get("/", (req, res) => {
  res.send("Movie Api");
});

app.listen(8080, () => {
  console.log("App listening on port 8080");
});
