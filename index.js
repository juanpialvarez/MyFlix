const test = "test";
console.log(test);
const port = process.env.PORT || 8080;

const express = require("express"),
  morgan = require("morgan"),
  fs = require("fs"),
  path = require("path"),
  bodyParser = require("body-parser"),
  uuid = require("uuid"),
  mongoose = require("mongoose"),
  Models = require("./models.js"),
  passport = require("passport"),
  cors = require("cors"),
  bcrypt = require("bcrypt"),
  { check, validationResult } = require("express-validator");

require("./passport");

const movies = Models.Movie;
const users = Models.User;
let allowedOrigins = [
  "http://localhost:8080",
  "http://testsite.com",
  "http://localhost:1234",
  "myflix94.netlify.app",
];
// mongoose.connect("mongodb://127.0.0.1/myFlix", { useNewUrlParser: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true });
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
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors()
  // {
  //   origin: (origin, callback) => {
  //     if (!origin) return callback(null, true);
  //     if (allowedOrigins.indexOf(origin) === -1) {
  //       let message =
  //         "The CORS policy for this application doesn’t allow access from origin " +
  //         origin;
  //       return callback(new Error(message), false);
  //     }
  //     return callback(null, true);
  //   },
  // }
);
let auth = require("./auth")(app);

// HTTP Methods

// Get movies
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    movies
      .find()
      .then((movie) => res.status(200).json(movie))
      .catch((err) => {
        console.err(err);
        res.status(500).send(`Error: ${err}`);
      });
  }
);

app.get(
  "/users/:userName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { userName } = req.params;
    users
      .findOne({ userName: userName })
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
  }
);

// Get movie by title
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
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
  }
);

// Get genre by title
app.get(
  "/movies/genre/:genre",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
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
  }
);

// Get director by name
app.get(
  "/movies/director/:name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
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
  }
);

// Post new user.

app.post(
  "/users",
  [
    check("userName", "Username is required").isLength({ min: 5 }),
    check(
      "userName",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("password", "Password is required").not().isEmpty(),
    check("email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let newUser = req.body;
    let hashedPassword = users.hashPassword(newUser.password);
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
            password: hashedPassword,
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
  }
);

//update user
app.put(
  "/users/update/:userName",
  passport.authenticate("jwt", { session: false }),
  [
    check("userName", "Username is required").isLength({ min: 5 }),
    check(
      "userName",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("email", "Email does not appear to be valid").isEmail(),
    check("birthday", "Email is not a date").isDate(),
  ],
  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const { userName } = req.params;
    let updateUser = req.body;
    let hashedPassword = users.hashPassword(updateUser.password);
    users.findOne({ userName: userName }).then((user) => {
      if (!user) {
        return res.status(res.status(400).send(`${userName} doesn't exists.`));
      }
    });
    users
      .findOneAndUpdate(
        { userName: userName },
        {
          $set: {
            userName: updateUser.userName,
            email: updateUser.email,
            password: hashedPassword,
            birthday: updateUser.birthday,
          },
        },
        { new: true }
      )
      .then((user) => {
        res.status(201).json(user);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Put new user name
app.put(
  "/users/:userName/:newName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { userName, newName } = req.params;
    users
      .findOneAndUpdate(
        { userName: userName },
        {
          $set: {
            userName: newName,
          },
        },
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
  }
);

// Put movie into user's movie list
app.put(
  "/users/:userName/movies/:movieId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
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
  }
);

// Delete movie from user list of movies
app.delete(
  "/users/:userName/movies/:movieId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
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
  }
);

// Delete user
app.delete(
  "/users/:userName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
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
  }
);

// Listen

app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
