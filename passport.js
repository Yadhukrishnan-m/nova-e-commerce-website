const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;  



// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser(function(user, done) {
//   done(null, user);
// });

passport.use(new GoogleStrategy({
  clientID:"128629802692-k57rpr8tudjqk9u4b0mbee46q1qrk0g2.apps.googleusercontent.com",  // Your Google Client ID
  clientSecret: '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',  // Your Google Client Secret
  callbackURL: "http://localhost:3000/auth/google/callback",  // Callback URL after Google login
  passReqToCallback: true
},
function(request, accessToken, refreshToken, profile, done) {
  

  return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user); // You can choose what to store (e.g., user.id)
  });
  
  // Deserialize the user from the stored session data
  passport.deserializeUser((user, done) => {
    done(null, user); // You can fetch the full user from the DB here if needed
  });
  
  module.exports = passport;