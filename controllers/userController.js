const User = require("../models/usermodel");
const Product = require("../models/product");
const Category = require("../models/category");
const Review = require("../models/review");

//  for sending email otp
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const home = async (req, res) => {
  try {
    if (req.session.user_id) {
      const user = await User.findById(req.session.user_id);

      if (!user.is_active) {
        req.flash("error", "user is blocked ,please contact suport");
        res.redirect("/login");

        return;
      }
    }
    const products = await Product.find().populate("category");
    return res.render("home", { products });
  } catch (error) {
    console.log(error.message);
  }
};

const register = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message);
  }
};

// for crypting the password
const bcrypt = require("bcrypt");
const securepassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// Nodemailer transporter setup----------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "novafassion4men@gmail.com",
    pass: "yhzz rqpj hojx thkj",
  },
});

// to insert the user
const insertUser = async (req, res) => {
  try {
    // console.log(req.body);
    const spassword = await securepassword(req.body.password); //get password here and make it crypted
    const user = new User({
      name: req.body.name,
      email: req.body.email,

      password: spassword,
    });
    req.session.tempUser = user;

    // Generate OTP----------------------------------------
    const otp = crypto.randomInt(1000, 9999).toString();

    // Store OTP and expiry in session-----------------------------------
    req.session.otp = otp;
    req.session.otpExpiry = Date.now() + 120000;

    // Send OTP to the user's email
    const mailOptions = {
      from: "novafassion4men@gmail.com",
      to: req.body.email,
      subject: "OTP for Email Verification",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.from nova fassions by Yadhukrishnan`,
    };

    await transporter.sendMail(mailOptions);

    req.session.useremail = req.body.email;
    res.redirect("/otp");
  } catch (error) {
    console.log(error);
  }
};

const otpload = async (req, res) => {
  try {
    res.render("otp", {
      email: req.session.useremail,
      timeLimit: req.session.otpExpiry,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// verify otp
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.useremail;

    // Check if OTP is valid and not expired
    if (req.session.otp && req.session.otpExpiry > Date.now()) {
      if (otp === req.session.otp) {
        // OTP verified successfully
        const tempUser = req.session.tempUser;

        console.log("Entered OTP:", otp);
        console.log("Stored OTP:", req.session.otp);

        // Clear OTP and temp data from session
        req.session.otp = null;
        req.session.otpExpiry = null;
        req.session.tempUser = null;

        // Save the user to the database after OTP verification
        const user = new User(tempUser);
        const userData = await user.save();

        if (userData) {
          // Redirect to success or login page after successful registration
          req.flash("success", "registration sucess now login");
          res.redirect("/login");
        } else {
          req.flash("error", "User registration failed!");
          res.redirect("/register");
        }
      } else {
        req.flash("error", "Invalid OTP");
        res.redirect("/otp");
      }
    } else {
      req.flash("error", "OTP has expired or is invalid");
      res.redirect("/otp");
    }
  } catch (error) {
    console.log(error.message);
    res.redirect("/otp");
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.session.useremail;

    if (!email) {
      req.flash("error", " Please register again.");
      return res.redirect("/register");
    }

    // Generate new OTP
    const newOtp = crypto.randomInt(1000, 9999).toString();

    // Update OTP and expiry in session
    req.session.otp = newOtp;
    req.session.otpExpiry = Date.now() + 120000; // OTP valid for 5 minutes

    // Send OTP to the user email
    const mailOptions = {
      from: "novafassion4men@gmail.com",
      to: email,
      subject: "Resend OTP for Email Verification",
      text: `Your new OTP is ${newOtp}. It will expire in 2 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    req.flash("success", "A new OTP has been sent to your email.");
    return res.redirect("/otp");
  } catch (error) {
    console.log(error);
    req.flash("error", "Error resending OTP. Please try again.");
    return res.redirect("/otp");
  }
};

//  for user login load
const loaginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      if (!userData.is_active) {
        return res.json({ success: false, message: "user is blocked" });
      }
      if (!userData.password) {
        return res.json({
          success: false,
          message: "Email and passcode is incorrect",
        });
      }

      // res.json({success:false,message:'Email and passcode is incorrect'})
      // req.flash('error', 'Email and passcode is incorrect');  //you registered through google so sign in with google

      const passwordMatch = await bcrypt.compare(password, userData.password);
      // console.log(passwordMatch);

      if (passwordMatch) {
        req.session.user_id = userData._id;

        return res.json({ success: true });
      } else {
        return res.json({
          success: false,
          message: "Email and passcode is incorrect",
        });
      }
    } else {
      return res.json({
        success: false,
        message: "Email and passcode is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const sucessGoogleLogin = async (req, res) => {
  try {
    const { emails } = req.user;
    const { displayName } = req.user;
    const email = emails[0].value;
    console.log(displayName, emails[0].value);

    let userData = await User.findOne({ email: email }); //to check the user is alredy in database
    if (!userData) {
      // If user does not exist, create a new one
      const user = new User({
        name: displayName,
        email: email,
      });

      await user.save(); // Save the user in the database
      console.log("User saved successfully");
    } else {
      console.log("User already exists");
    }
    userData = await User.findOne({ email: email }); // again get the user data to insert in session
    req.session.user_id = userData._id;

    res.redirect("/");
    console.log("sucessgoogle login");
  } catch (error) {
    console.log(error);
  }
};

const failureGoogleLogin = async (req, res) => {
  try {
    req.flash("error", "google login failed ");
    res.redirect("/login");
    console.log("faile google  login");
  } catch (error) {
    console.log(error);
  }
};

const sucessfacebookLogin = async (req, res) => {
  try {
    const { displayName } = req.user;

    // Check if emails exist and are properly structured
    const email =
      req.user.emails && req.user.emails[0] ? req.user.emails[0].value : null;

    if (!email) {
      // Handle the case where the email is not available
      console.log("Email not provided by Facebook");
      console.log("Facebook Profile:", req.user);

      return res
        .status(400)
        .send("No email associated with the Facebook account.");
    }

    console.log(displayName, email);

    // Check if user is already in the database
    let userData = await User.findOne({ email: email });

    if (!userData) {
      // If the user does not exist, create a new one
      const user = new User({
        name: displayName,
        email: email,
      });

      await user.save(); // Save the user in the database
      console.log("User saved successfully");
      req.session.user_id = userData._id;
    } else {
      console.log("User already exists");
    }
    req.session.user_id = userData._id;

    res.redirect("/");
    console.log("Success Facebook login");
  } catch (error) {
    console.log("Error during Facebook login:", error);
    res.status(500).send("An error occurred during Facebook login.");
  }
};

// for facebook failed login
const failurefacebookLogin = async (req, res) => {
  try {
    req.flash("error", "facebook login failed ");
    res.redirect("/login");
    console.log("faile facebook login");
  } catch (error) {
    console.log(error);
  }
};

const productLoad = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id }).populate(
      "user"
    );
    const product = await Product.findById(req.params.id).populate("category");
    const products = await Product.find().populate("category");

    res.render("product", { product, products, reviews });
  } catch (error) {
    console.log(error);
  }
};

const productZoom = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    res.render("productZoom", { product: product });
  } catch (error) {
    console.log(error);
  }
};

const review = async (req, res) => {
  try {
    const productId = req.params.productId;
    const description = req.body.comment;
    const date = new Date();
    if (req.session.user_id) {
      const userId = req.session.user_id;

      const review = new Review({
        product: productId,
        user: userId,
        description: description,
        date: date,
      });
      await review.save();
      req.flash("success", "thanks for your review");
      res.redirect(`/product/${productId}`);
    } else {
      req.flash("error", "login to post review");
      return res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadShop = async (req, res) => {
  try {
    if (req.session.user_id) {
      const user = await User.findById(req.session.user_id);

      if (!user.is_active) {
        req.flash("error", "user is blocked ,please contact suport");
        res.redirect("/login");

        return;
      }
    }

    const { search, sort, category } = req.query;

    // Build the search object for filtering
    let filter = {};
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    //  to build the sort object
    let sortOptions = {};
    if (sort) {
      switch (sort) {
        case "name-asc":
          sortOptions = { name: 1 };
          break;
        case "name-desc":
          sortOptions = { name: -1 };
          break;
        case "price-asc":
          sortOptions = { offerPrice: 1 };
          break;
        case "price-desc":
          sortOptions = { offerPrice: -1 };
          break;
        case "offer-asc":
          sortOptions = { discount: 1 };
          break;
        case "offer-desc":
          sortOptions = { discount: -1 };
          break;
        default:
          sortOptions = {};
      }
    }

    const categories = await Category.find();
    const products = await Product.find(filter)
      .sort(sortOptions)
      .populate("category");

    res.render("shop", { products, categories, search, sort, category });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  home,
  register,
  insertUser,
  loaginLoad,
  verifyLogin,
  verifyOtp,
  otpload,
  resendOtp,
  sucessGoogleLogin,
  failureGoogleLogin,
  sucessfacebookLogin,
  failurefacebookLogin,
  productLoad,
  review,
  loadShop,
  productZoom,
};
