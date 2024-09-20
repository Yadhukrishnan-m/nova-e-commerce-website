const express=require('express');
const user_route=express();
const session=require('express-session')

user_route.use(session({
    secret: 'your_secret_key',  
    resave: false,             
    saveUninitialized: true,   
    cookie: { secure: false }
}));


const path=require("path");

user_route.set('view engine','ejs');
user_route.set('views','./views/user');

const flash = require('connect-flash');
user_route.use(flash());

// Middleware to pass flash messages to every response
user_route.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

//  for sending email otp
const crypto = require("crypto");
//for google sifn in passport -
const passport=require('passport');
require("../passport")
require('../passportFacebook')

user_route.use(passport.initialize());
user_route.use(passport.session());


// requireing middleware
const mailcheck=require('../middleware/emailcheck')

const userController=require('../controllers/userController');

user_route.get('/',userController.home);

user_route.get('/register',userController.register);
user_route.post('/register',mailcheck.checkDuplicateEmail,userController.insertUser);

user_route.get('/otp', userController.otpload); // Ensure this route exists in your controller
user_route.post('/otp',userController.verifyOtp)
user_route.get('/resend-otp', userController.resendOtp);

// google login ----------------
user_route.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}))
user_route.get("/auth/google/callback",passport.authenticate('google',{
  successRedirect:'/sucess',
  failureRedirect:'/failure'
}))
user_route.get("/sucess",userController.sucessGoogleLogin);
user_route.get("/failure",userController.failureGoogleLogin)

//facebook login
user_route.get('/auth/facebook',passport.authenticate('facebook',{scope:['public_profile','email']}));
user_route.get("/auth/facebook/callback",passport.authenticate('facebook',{
  successRedirect:'/sucessfacebook',
  // failureRedirect:'/failure'
}))
user_route.get("/sucessfacebook",userController.sucessfacebookLogin);
user_route.get("/sucessfacebook",userController.failurefacebookLogin);

// login 
user_route.get('/login',userController.loaginLoad);
user_route.post('/login',userController.verifyLogin)

user_route.get('/product/:id',userController.productLoad);
user_route.post('/product/review/:productId',userController.review)
user_route.get('/product/productZoom/:productId',userController.productZoom);

user_route.get('/shop',userController.loadShop);


user_route.get('*',function(req,res){
  res.render('404');         //after localhost.../admin whatever the parameter passed it redirect to /admin again
  })

module.exports=user_route;