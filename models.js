const mongoose = require("mongoose");

let movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: {
    name: { type: String, required: true },
    description: String,
  },
  director: {
    name: { type: String, required: true },
    biography: String,
    birth: Date,
    death: Date,
  },
  imagePath: String,
  actors: [String],
  featured: Boolean,
});

let userSchema = mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  favouriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "movie" }],
  birthday: Date,
});

let Movie = mongoose.model("Movie", movieSchema);
let User = mongoose.model("User", userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
