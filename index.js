const express = require("express"),
  morgan = require("morgan"),
  fs = require("fs"),
  path = require("path"),
  bodyParser = require("body-parser"),
  uuid = require("uuid"),
  mongoose = require("mongoose"),
  Models = require("./models.js");

const movies = Models.movie;
const users = Models.user;

mongoose.connect("mongodb://127.0.0.1/myFlix", { useNewUrlParser: true });
mongoose.set("strictQuery", true);
const db = mongoose.connection;
db.on("error", (err) => console.error(err));
db.once("open", () => console.log("Connected to db"));

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
  movies
    .find()
    .then((movie) => res.status(200).json(movie))
    .catch((err) => {
      console.err(err);
      res.status(500).send(`Error: ${err}`);
    });
});

// Get movie by title
app.get("/movies/:title", (req, res) => {
  const { title } = req.params;
  movies
    .findOne({ title: title })
    .then((movie) => {
      if (movie) {
        res.status(201).json(movie);
      } else {
        res.status(400).send(`Movie ${title} not found`);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`Error: ${err}`);
    });
});

// Get genre by title
app.get("/movies/genre/:genre", (req, res) => {
  const { genre } = req.params;
  movies
    .findOne({ "genre.name": genre })
    .then((movie) => {
      if (movie) {
        res.status(201).json(movie.genre);
      } else {
        res.status(400).send(`Genre ${genre} not found`);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`Error: ${err}`);
    });
});

// Get director by name
app.get("/movies/director/:name", (req, res) => {
  const { name } = req.params;
  movies
    .findOne({ "director.name": name })
    .then((movie) => {
      if (movie) {
        res.status(201).json(movie.director);
      } else {
        res.status(400).send(`Director ${name} not found`);
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(`Err: ${err}`);
    });
});

// Post new user.

app.put("/users", (req, res) => {
  let newUser = req.body;
  users.findOne({ userName: newUser.userName }).then((user) => {
    if (user) {
      return res.status(
        res.status(400).send(`${newUser.userName} already exists.`)
      );
    } else {
      users
        .create({
          userName: newUser.userName,
          email: newUser.email,
          password: newUser.password,
          birthday: newUser.birthday,
        })
        .then((user) => {
          res.status(201).json(user);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send("Error: " + error);
        });
    }
  });
});

// Put new user name
app.post("/users/:userName/:newName", (req, res) => {
  const { userName, newName } = req.params;
  users
    .findOneAndUpdate(
      { userName: userName },
      { $set: { userName: newName } },
      { new: true }
    )
    .then((user) => {
      if (user) {
        res.status(201).json(user);
      } else {
        res.status(400).send(`User ${userName} not found`);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`Error: ${err}`);
    });
});

// Put movie into user's movie list
app.post("/users/:userName/movies/:movieId", (req, res) => {
  const { userName, movieId } = req.params;
  users
    .findOneAndUpdate(
      { userName: userName },
      { $addToSet: { favouriteMovies: movieId } },
      { new: true }
    )
    .then((user) => {
      if (user) {
        res.status(201).json(user.favouriteMovies);
      } else {
        res
          .status(401)
          .send(`User ${userName} or movie ID ${movieId} not found`);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`Error: ${err}`);
    });
});

// Delete movie from user list of movies
app.delete("/users/:userName/movies/:movieId", (req, res) => {
  const { userName, movieId } = req.params;
  users
    .findOneAndUpdate(
      { userName: userName },
      { $pull: { favouriteMovies: movieId } },
      { new: true }
    )
    .then((user) => {
      if (user) {
        res.status(201).json(user.favouriteMovies);
      } else {
        res
          .status(401)
          .send(`User ${userName} or movie ID ${movieId} not found`);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`Error: ${err}`);
    });
});

// Delete user
app.delete("/users/:userName", (req, res) => {
  const { userName } = req.params;
  users
    .findOneAndRemove({ userName: userName })
    .then((user) => {
      if (user) {
        res.status(201).send(`User ${userName} was deleted`);
      } else {
        res.status(400).send(`User ${userName} not found`);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`Error: ${err}`);
    });
});

// Listen
app.listen(8080, () => {
  console.log("App listening on port 8080");
});
