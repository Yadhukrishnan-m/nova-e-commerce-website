const express=require('express');
const session=require('express-session')
const flash = require('connect-flash');
const admin_route=express();


admin_route.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true if using HTTPS
}));


const path=require("path");

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');


admin_route.use(flash());

// Middleware to pass flash messages to every response
admin_route.use((req, res, next) => {
//   res.locals.msg = req.flash('msg');
res.locals.errorMsg = req.flash('errorMsg');
res.locals.successMsg = req.flash('successMsg');
  next();
});
// requiring multer for file upload
const multer=require('multer')
const productMulter=require('../middleware/productMulter')

const adminController=require('../controllers/adminController');

//requiring middlewares for authentication
const adminAuth=require('../middleware/adminAuth') 


// const admin_route = require('./adminRoute');
admin_route.get('/',adminAuth.isLogout,adminController.loadLogin)
admin_route.post('/',adminController.verifyAdmin);
admin_route.get('/dashboard',adminAuth.isLogin,adminController.loadDashboard);
admin_route.get('/users',adminAuth.isLogin,adminController.loadusers);
admin_route.post('/users/:id', adminController.userStatus);

admin_route.get('/category',adminAuth.isLogin,adminController.loadCategory);
admin_route.post('/category',adminController.addCategory);
admin_route.post('/category/:id', adminController.listCategory);
admin_route.get('/category/edit/:id',adminAuth.isLogin,adminController.loadEditCategory);
admin_route.post('/category/edit/:id',adminController.editCategory);

// product 
admin_route.get('/product',adminAuth.isLogin,adminController.loadProduct)

admin_route.get('/product/addProduct',adminAuth.isLogin,adminController.loadAddProduct)
admin_route.post('/product/addProduct',productMulter.array('image'),adminController.addProduct);
admin_route.get('/product/edit/:id',adminAuth.isLogin,adminController.loadEditProduct)
admin_route.post('/product/edit/:id',productMulter.array('image'),adminController.editProduct)

admin_route.post('/product/:id',adminController.listProduct)

// for admin to logout

admin_route.get('/logout',adminAuth.isLogin,adminController.logout);

admin_route.get('*',function(req,res){
  res.render('404');         //after localhost.../admin whatever the parameter passed it redirect to /admin again
  })


module.exports=admin_route;