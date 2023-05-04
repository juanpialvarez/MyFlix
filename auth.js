const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport');

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.userName,
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

module.exports = (router) => {
  /** Log user in
   * @param User
   * @param Password
   * user and password are passed in the body
   * @returns a body object containing username and token
   * Deletes a user based on username.
   * */

  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: 'Something is not right',
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send('error:' + error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user: user, token: token });
      });
    })(req, res);
  });
};
