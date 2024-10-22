const express=require('express');
const user_route=express();
const session=require('express-session')


user_route.use('/',session({
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
require("../config/passport")
require('../config/passportFacebook')

user_route.use(passport.initialize());
user_route.use(passport.session());

// requiring admin auth
// const userAuth=require('../middleware/userAuth') 

// requireing middleware
const mailcheck=require('../middleware/emailcheck')
const userAuth=require('../middleware/userAuth')

const userController=require('../controllers/user/userController');
const userCouponController=require('../controllers/user/userCouponController');
const paymentController=require('../controllers/user/paymentController');
const walletController=require('../controllers/user/walletController');


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
  failureRedirect:'/failure'
}))
user_route.get("/sucessfacebook", userController.sucessfacebookLogin);
user_route.get("/failurefacebook", userController.failurefacebookLogin);

// login 
user_route.get('/login',userController.loaginLoad);
user_route.post('/login',userController.verifyLogin)

user_route.get('/forgotPassword/email',userController.forgotPasswordEmail);
user_route.post('/forgotPassword/email',userController.ForgotPasswordOtp)
user_route.get('/forgotPassword/otp',userController.loadForgotPasswordOtp)
user_route.post('/forgotPassword/otp',userController.verifyForgotPasswordOtp)
user_route.get('/forgotPassword/resend-otp', userController.forgotPasswordresendOtp);
user_route.get('/forgotpassword/changepassword',userController.loadChangePassword);
user_route.post('/forgotpassword/changepassword',userController.changePassword);

user_route.get('/product/:id',userController.productLoad);
user_route.post('/product/review/:productId',userController.review)
user_route.get('/product/productZoom/:productId',userController.productZoom);

user_route.get('/shop',userController.loadShop);

user_route.get('/addToCart/:productId/:size', userController.addToCart);
user_route.get('/removeFromCart/:productId',userController.removeFromCart)
user_route.get('/cart',userAuth.isLogin,userController.loadCart);
user_route.get('/cart/:counter/:productId',userController.productCount)

user_route.get('/accountDetails',userAuth.isLogin,userController.accountDetails);
user_route.post('/accountDetails',userController.updateDetails);
user_route.get('/address',userAuth.isLogin,userController.loadAddress)
user_route.get('/addAddress',userAuth.isLogin,userController.loadAddAddress) 
user_route.post('/addAddress',userController.addAddress);
user_route.get('/editAddress/:id',userAuth.isLogin,userController.loadEditAddress);
user_route.post('/editAddress/:id',userController.editAddress);
user_route.get('/deleteAddress/:id',userController.deleteAddress);
user_route.get('/checkOut',userAuth.isLogin,userController.checkOut);
user_route.get('/checkOutEditAddress/:id',userController.checkOutLoadEditAddress)
user_route.post('/checkOutEditAddress/:id',userController.checkOutEditAddress)
user_route.get('/checkOutDeleteAddress/:id',userController.chekOutDeleteAddress);
user_route.get('/checkOutAddAddress',userAuth.isLogin,userController.checkOutLoadAddAddress) 
user_route.post('/checkOutAddAddress',userController.checkOutAddAddress) 
user_route.get('/placeOrder/:addressId/:couponCode/:paymentMethod',userAuth.isLogin,userController.placeOrder) 
user_route.get('/orderSuccess/:orderId',userController.orderSuccess);
user_route.get('/orders',userAuth.isLogin,userController.orders) 
user_route.get('/orderDetails/:orderId',userController.orderDetails);

user_route.get('/cancelOrder/:orderId',userAuth.isLogin,userController.cancelOrder);
user_route.get('/returnOrder/:orderId',userAuth.isLogin,userController.ReturnOrder);

user_route.get('/singleProductCheckout/:productId/:size',userAuth.isLogin,userController.singleProductCheckout)
user_route.get('/singleProductOrder/:productId/:count/:addressId/:size/:couponCode/:paymentMethod',userAuth.isLogin,userController.singleProductOrder);
user_route.get('/singleCheckoutEditAddress/:id/:productId/:size',userAuth.isLogin,userController.singleCheckOutLoadEditAddress);
user_route.post('/singleCheckoutEditAddress/:id/:productId/:size',userAuth.isLogin,userController.singleCheckOutEditAddress);
user_route.get('/singleCheckoutAddAddress/:productId/:size',userAuth.isLogin,userController.singleCheckOutLoadAddAddress);
user_route.post('/singleCheckoutAddAddress/:productId/:size',userAuth.isLogin,userController.singleCheckOutAddAddress);
user_route.get('/addToWishlist/:productId/:size',userController.addToWishlist);
user_route.get('/wishlist',userAuth.isLogin,userController.loadWishlist)
user_route.get('/removeFromWishlist/:wishlistId',userController.removeFromWishlist)
user_route.post('/applyCoupon',userCouponController.applyCoupon);
user_route.get('/removeCoupon',userCouponController.removeCoupon)
user_route.post('/applyCouponSingleProduct',userCouponController.applyCoupon);
user_route.get('/removeCouponSingleProduct',userCouponController.removeCoupon)
user_route.get('/paypal',paymentController.payProduct);
user_route.get('/paymentsuccess',paymentController.success)
user_route.get('/paymentcancel',paymentController.cancel)
user_route.get('/buyNowPaypal',paymentController.buyNowPayProduct);
user_route.get('/buyNowPaymentsuccess',paymentController.buyNowSuccess)
user_route.get('/buyNowPaymentcancel',paymentController.buyNowCancel);
user_route.get('/wallet',userAuth.isLogin,walletController.loadWallet);
user_route.get('/wallet/addMoney',userAuth.isLogin,walletController.loadAddMoney)
user_route.post('/wallet/addMoney',walletController.addMoney)

user_route.get('/walletPaypal/:amount',walletController.payProduct);
user_route.get('/walletpaymentsuccess',walletController.success)
user_route.get('/walletpaymentcancel',walletController.cancel)

user_route.get('/downloadInvoice/:orderId',paymentController.downloadInvoice);


user_route.get('/logout',userController.logout)
user_route.get('*',function(req,res){
  res.render('404');         //after localhost.../admin whatever the parameter passed it redirect to /admin again
  })

module.exports=user_route;
