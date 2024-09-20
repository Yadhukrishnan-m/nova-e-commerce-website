const mongoose=require("mongoose")
mongoose.connect("mongodb://localhost:27017/nova_database")


const express=require("express");
const app=express();
const session=require('express-session')

app.use(session({
    secret: 'your_secret_key',  
    resave: false,             
    saveUninitialized: true,   
    cookie: { secure: false }
}));


app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

const nocache=require('nocache');
app.use(nocache());

const path=require("path")

//to serve the static files in for ejs 
// app.use('/assets', express.static(path.join(__dirname, 'views/user/assets')));

// Serve static files for user
app.use('/user', express.static(path.join(__dirname, 'public/user')));

app.use(express.static('public'));


// app.use('/user', express.static(path.join(__dirname, 'public/productImages')));


// Serve static files for admin
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute)


//for user route
const userRoute = require('./routes/userRoute');
app.use('/',userRoute)

// for  admin route 

app.listen(3000,()=>{
    console.log("server is running");    
})