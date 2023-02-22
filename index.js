const express = require("express"),
  morgan = require("morgan"),
  fs = require("fs"),
  path = require("path"),
  bodyParser = require("body-parser"),
  uuid = require("uuid");

let movies = require("./local_data/movies.json");
let users = require("./local_data/users.json");

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
});

// Middware
app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.static("public"));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Error");
});
app.use(bodyParser.json());

// HTTP Methods

// Get movies
app.get("/movies", (req, res) => {
  res.status(200).json(movies);
});

// Get movie by title
app.get("/movies/:title", (req, res) => {
  const movie = movies.find((movie) => movie.title === req.params.title);
  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send(`Movie title ${req.params.title} could not be found`);
  }
});

// Get genre by title
app.get("/movies/genre/:title", (req, res) => {
  const genre = movies.find((movie) => movie.title === req.params.title).genre;
  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send(`Movie title ${req.params.title} could not be found`);
  }
});

// Get director by name
app.get("/movies/director/:name", (req, res) => {
  const director = movies.find(
    (movie) => movie.director.name === req.params.name
  ).director;
  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send(`Movie title ${req.params.name} could not be found`);
  }
});

// Post new user.

app.post("/users", (req, res) => {
  let newUser = req.body;
  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(200).json(newUser);
  } else {
    res.status(400).send("Missing user name");
  }
});

// Put new user name
app.put("/users/:userName/:newName", (req, res) => {
  const user = users.find((user) => user.name === req.params.userName);
  if (user) {
    users.find((user) => user.name === req.params.userName).name =
      req.params.newName;
    newUserName = users.find((user) => user.name === req.params.newName);
    res.status(200).json(newUserName);
  } else {
    res.status(400).send(`User with name ${req.params.userName} not found`);
  }
});

// Put movie into user's movie list
app.put("/users/:userName/addMovie/:title", (req, res) => {
  const user = users.find((user) => user.name === req.params.userName);
  const movie = movies.find((movie) => movie.title === req.params.title);

  if (user && movie) {
    users
      .find((user) => user.name === req.params.userName)
      .userMovies.push(movie);
    res
      .status(200)
      .json(users.find((user) => user.name === req.params.userName).userMovies);
  } else if (!user) {
    res.status(400).send(`Could not find user name: ${req.params.userName}`);
  } else if (!movie) {
    res.status(400).send(`Could not find movie title: ${req.params.title}`);
  } else {
    res
      .status(400)
      .send(
        `Username: ${req.params.userName} and movie title: ${req.params.userName} could not be found`
      );
  }
});

// Delete movie from user list of movies
app.delete("/users/:userName/deleteMovie/:title", (req, res) => {
  const user = users.find((user) => user.name === req.params.userName);
  const movie = movies.find((movie) => movie.title === req.params.title);

  if (user && movie) {
    users
      .find((user) => user.name === req.params.userName)
      .userMovies.filter((movie) => movie.title !== req.params.title);
    res.status(200).send(`Movie ${req.params.title} deleted from favourites`);
  } else if (!user) {
    res.status(400).send(`Could not find user name: ${req.params.userName}`);
  } else if (!movie) {
    res.status(400).send(`Could not find movie title: ${req.params.userName}`);
  } else {
    res
      .status(400)
      .send(
        `Username: ${req.params.userName} and movie title: ${req.params.userName} could not be found`
      );
  }
});

// Delete user
app.delete("/users/:id", (req, res) => {
  const user = users.find((user) => user.id == req.params.id);
  if (user) {
    users.filter((user) => user.id !== req.params.id);
    res.status(200).send(`User with id ${req.params.id} removed`);
  } else {
    res.status(400).send(`User with id ${req.params.id} not found`);
  }
});

// Listen
app.listen(8080, () => {
  console.log("App listening on port 8080");
});
