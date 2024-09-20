const passport = require('passport');
//facebook
const FacebookStrategy=require('passport-facebook').Strategy

passport.serializeUser((user, done) => {
    done(null, user); 
  });
  
  // Deserialize the user from the stored session data
  passport.deserializeUser((user, done) => {
    done(null, user); 
  });
  
  passport.use(new FacebookStrategy({
    clientID:"840412534932531",  // Your Google Client ID
    clientSecret: 'baaa6682ae3ea64d06af055864898364',  // Your Google Client Secret
    callbackURL: "http://localhost:3000/auth/facebook/callback",  // Callback URL after Google login
    profileFields: ['id', 'displayName', 'email']
    // passReqToCallback: true
 
  },
  function(request, accessToken, refreshToken, profile, done) {
    
  
    return done(null, profile);
  }));
  