const User = require("../../models/usermodel");
const Product = require("../../models/product");
const Category = require("../../models/category");
const Review = require("../../models/review");
const Cart = require("../../models/cart");
const Address = require("../../models/address");
const Order = require("../../models/order");
const Wishlist = require("../../models/wishlist");
const Coupon = require("../../models/coupon");
const Wallet = require("../../models/wallet");

//  for sending email otp
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const home = async (req, res) => {
  try {
    let user = "";
    // if (req.session.user_id) {
    // user = await User.findById(req.session.user_id);

    //   if (!user.is_active) {
    //     req.flash("error", "user is blocked ,please contact suport");
    //     res.redirect("/login");

    //     return;
    //   }
    // }
    const products = await Product.find().populate("category");
    return res.render("home", { products, user });
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
const { log } = require("console");
// const product = require("../models/product");
// const { findOne } = require("../models/adminmodel");
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
      text: `Your OTP is ${otp}. It will expire in 2  minutes.from nova fassions by Yadhukrishnan`,
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

        // create a wallet for user and give welcome bonus
        const walletdata = new Wallet({
          user: userData._id,
          balance: 100,
          transaction: [
            {
              amount: 100,
              transactionMode: "welcome bonus",
              date: new Date(),
            },
          ],
        });
        walletdata.save();

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
    req.session.otpExpiry = Date.now() + 120000; // OTP valid for 2 minutes

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
    if (req.session.user_id) {
      return res.redirect("/accountDetails");
    } // to check alreedy logged in or logged out for the showing log in page and account details accordingly
    else {
      return res.render("login");
    }
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

      const userdata = await user.save();

      // create a wallet for user and give welcome bonus

      const walletdata = new Wallet({
        user: userdata._id,
        balance: 100,
        transaction: [
          {
            amount: 100,
            transactionMode: "welcome bonus",
            date: new Date(),
          },
        ],
      });
      walletdata.save();

      // Save the user in the database
      // console.log("User saved successfully");
    } else {
      // console.log("User already exists");
    }
    userData = await User.findOne({ email: email }); // again get the user data to insert in session
    req.session.user_id = userData._id;

    if (userData.is_active == 0) {
      req.flash("error", "user is blocked  ");
      return res.redirect("/login");
    }

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

      const userdata = await user.save(); // Save the user in the database

      userData = userdata;
      // create a wallet for user and give welcome bonus
      const walletdata = new Wallet({
        user: userdata._id,
        balance: 100,
        transaction: [
          {
            amount: 100,
            transactionMode: "welcome bonus",
            date: new Date(),
          },
        ],
      });
      walletdata.save();

      console.log("User saved successfully");
      req.session.user_id = userdata._id;
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

    let inCart = await Cart.findOne({
      user: req.session.user_id,
      product: req.params.id,
    });

    if (!inCart) {
      inCart = 0;
    } else {
      inCart = 1;
    }

    //for wishlist
    const isWishlisted = await Wishlist.findOne({
      user: req.session.user_id,
      product: req.params.id,
    });
    res.render("product", { product, products, reviews, inCart, isWishlisted });
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
    // if (req.session.user_id) {
    //   const user = await User.findById(req.session.user_id);

    //   if (!user.is_active) {
    //     req.flash("error", "user is blocked ,please contact suport");
    //    return res.redirect("/login");

    //   }
    // }

    const {
      search,
      sort,
      category,
      available,
      page = 1,
      limit = 10,
    } = req.query;

    // Build the search object for filtering
    let filter = {};
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (available === "true") {
      filter.stock = { $gt: 0 }; // Only products with stock > 0
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

    // pagination logic is here
    const pageNum = parseInt(page) || 1; // Default to page 1 if not provided
    const pageSize = 8; // Default to 10 products per page
    const skip = (pageNum - 1) * pageSize; // Calculate number of products to skip

    // Get total product count for pagination
    const totalProducts = await Product.countDocuments(filter);

    const categories = await Category.find();
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate("category");
    const totalPages = Math.ceil(totalProducts / pageSize);

    res.render("shop", {
      products,
      categories,
      search,
      sort,
      category,
      currentPage: pageNum,
      totalPages,
      limit: pageSize,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

// render forgot password email
const forgotPasswordEmail = async (req, res) => {
  try {
    res.render("forgotPasswordEmail");
  } catch (error) {
    console.log(error);
  }
};

// posted email retrive here and sent otp
const ForgotPasswordOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (!userData) {
      req.flash("error", "user not exist");
      return res.redirect("/forgotPassword/email");
    }

    // Generate OTP----------------------------------------
    const otp = crypto.randomInt(1000, 9999).toString();

    // Store OTP and expiry in session-----------------------------------
    req.session.userData = userData;
    req.session.useremail = email;
    req.session.otp = otp;
    req.session.otpExpiry = Date.now() + 120000;

    // Send OTP to the user's email
    const mailOptions = {
      from: "novafassion4men@gmail.com",
      to: req.body.email,
      subject: "OTP for Email Verification",
      text: `Your OTP for forgot password is ${otp}. It will expire in 2 minutes .`,
    };

    await transporter.sendMail(mailOptions);

    //  req.session.useremail = req.body.email;
    console.log(otp);

    res.redirect("/forgotPassword/otp");
  } catch (error) {
    console.log(error);
  }
};

const loadForgotPasswordOtp = async (req, res) => {
  try {
    res.render("forgotPasswordOtp", {
      timeLimit: req.session.otpExpiry,
      email: req.session.useremail,
    });
  } catch (error) {
    console.log(error);
  }
};

const forgotPasswordresendOtp = async (req, res) => {
  try {
    const email = req.session.useremail;

    if (!email) {
      req.flash("error", " email not found.");
      return res.redirect("/login");
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
    return res.redirect("/forgotPassword/otp");
  } catch (error) {
    console.log(error);
    req.flash("error", "Error resending OTP. Please try again.");
    return res.redirect("/forgotPassword/otp");
  }
};

const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const otp = req.body.otp;

    if (req.session.otp && req.session.otpExpiry > Date.now()) {
      if (otp === req.session.otp) {
        // OTP verified successfully

        // Clear OTP and temp data from session
        req.session.otp = null;
        req.session.otpExpiry = null;
        req.session.tempUser = null;
        res.redirect("/forgotPassword/changepassword");
      } else {
        req.flash("error", "invalid otp");
        res.redirect("/forgotPassword/otp");
      }
    } else {
      req.flash("error", "otp is expired");
      res.redirect("/forgotPassword/otp");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadChangePassword = async (req, res) => {
  try {
    res.render("changePassword");
  } catch (error) {
    console.log(error);
  }
};

const changePassword = async (req, res) => {
  try {
    const password = req.body.password;
    const userData = req.session.userData;

    const newPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(userData._id, { password: newPassword });
    req.flash("success", "password changed sucessfully");
    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};

const addToCart = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    if (!req.session.user_id) {
      req.flash("error", "You need to be logged in to add items to the cart.");
      return res.json({ error: "user not logged in " });
    }

    const existingCart = await Cart.findOne({
      user: req.session.user_id,
      product: req.params.productId,
    });
    const product = await Product.findById(req.params.productId);

    if (existingCart) {
      // res.redirect(`/cart`)
      return res.json({ exists: true });
    } else {
      const cart = new Cart({
        user: req.session.user_id,
        product: req.params.productId,
        size: req.params.size,
      });

      await cart.save();

      return res.json({ exists: false, message: "successfully added" });
    }
  } catch (error) {
    console.log(error);
  }
};

const removeFromCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({
      user: req.session.user_id,
      product: req.params.productId,
    });
    res.redirect("/cart");
  } catch (error) {
    console.log(error);
  }
};

const loadCart = async (req, res) => {
  try {
    if (!req.session.user_id) {
      req.flash("error", "please login ");
      return res.redirect("/login");
    }
    let totalPrice = 0;
    let totalOfferPrice = 0;
    const cart = await Cart.find({ user: req.session.user_id }).populate(
      "product"
    );
    cart.forEach((x) => {
      if (x.product.offerIsActive === 1) {
        totalOfferPrice += x.product.offerPrice * x.count;
      } else {
        totalOfferPrice += x.product.mrp * x.count;
      }
      totalPrice += x.product.mrp * x.count;
    });
    let discount = totalPrice - totalOfferPrice;

    res.render("cart", { cart, totalPrice, totalOfferPrice, discount });
  } catch (error) {
    console.log(error);
  }
};

const productCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.session.user_id,
      product: req.params.productId,
    }).populate("product");
    let size;
    if (cart.size == "M") {
      size = cart.product.stockM;
    } else if (cart.size == "S") {
      size = cart.product.stockS;
    } else if (cart.size == "L") {
      size = cart.product.stockL;
    } else if (cart.size == "XL") {
      size = cart.product.stockXL;
    } else if (cart.size == "XXL") {
      size = cart.product.stockXXL;
    }

    if (req.params.counter == 1) {
      if (cart.count < 5) {
        if (size > cart.count) {
          cart.count += 1;
          await cart.save();
        } else {
          // req.flash('error','Quantity not available ')
          return res.json({ error: "Quantity not available" });
        }
      } else {
        //   req.flash('error','limit reached')
        //  return res.redirect('/cart')
        return res.json({ error: "limit reached" });
      }
    } else if (req.params.counter == -1) {
      if (cart.count > 1) {
        cart.count -= 1;
        await cart.save();
      } else {
        return res.json({ error: "minimum one required" });
      }
    }
    const carts = await Cart.find({ user: req.session.user_id }).populate(
      "product"
    );
    let totalPrice = 0;
    let totalOfferPrice = 0;

    carts.forEach((x) => {
      if (x.product.offerIsActive === 1) {
        totalOfferPrice += x.product.offerPrice * x.count;
      } else {
        totalOfferPrice += x.product.mrp * x.count;
      }
      totalPrice += x.product.mrp * x.count;
    });
    let discount = totalPrice - totalOfferPrice;

    return res.json({
      count: cart.count,
      offerPrice:
        cart.product.offerIsActive === 1
          ? cart.product.offerPrice
          : cart.product.mrp,
      totalPrice: totalPrice,
      totalOfferPrice: totalOfferPrice,
      discount: discount,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "Something went wrong" });
  }
};

const accountDetails = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    res.render("accountDetails", { user });
  } catch (error) {
    console.log(error);
  }
};

const updateDetails = async (req, res) => {
  try {
    const name = req.body.name;
    const dateOfBirth = req.body.dob;
    const mobile = req.body.mobile;

    await User.findByIdAndUpdate(req.session.user_id, {
      name: name,
      dateOfBirth: dateOfBirth,
      mobile: mobile,
    });
    res.redirect("/accountDetails");
  } catch (error) {
    console.log(error);
  }
};

const loadAddress = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.session.user_id });

    res.render("address", { addresses });
  } catch (error) {
    console.log(error);
  }
};

const loadAddAddress = async (req, res) => {
  try {
    res.render("addAddress");
  } catch (error) {
    console.log(error);
  }
};

const addAddress = async (req, res) => {
  try {
    const address = new Address({
      user: req.session.user_id,
      street: req.body.street,
      houseName: req.body.houseName,
      landmark: req.body.landmark,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      zip: req.body.zip,
      addressType: req.body.addressType,
      mobile: req.body.mobile,
      altMobile: req.body.altMobile,
    });
    const addressData = await address.save();

    if (addressData) {
      req.flash("success", "successfully added");
      res.redirect("/address");
    }
  } catch (error) {
    console.log(error);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      return res.redirect("/");
    });
  } catch (error) {
    console.log(error);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    res.render("editAddress", { address });
  } catch (error) {
    console.log(error);
  }
};

const editAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndUpdate(req.params.id, {
      user: req.session.user_id,
      street: req.body.street,
      houseName: req.body.houseName,
      landmark: req.body.landmark,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      zip: req.body.zip,
      addressType: req.body.addressType,
      mobile: req.body.mobile,
      altMobile: req.body.altMobile,
    });

    req.flash("success", "successfully edited");
    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndDelete(req.params.id);

    req.flash("success", "successfully deleted");
    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
};

const checkOut = async (req, res) => {
  try {
    let totalPrice = 0;
    let totalOfferPrice = 0;
    const cart = await Cart.find({ user: req.session.user_id }).populate(
      "product"
    );
    const addresses = await Address.find({ user: req.session.user_id });

    const wallet = await Wallet.findOne({ user: req.session.user_id });
    console.log(wallet);

    let isAvailable = 1;

    let size;
    cart.forEach((x) => {
      if (x.size == "M") {
        size = x.product.stockM;
      } else if (x.size == "S") {
        size = x.product.stockS;
      } else if (x.size == "L") {
        size = x.product.stockL;
      } else if (x.size == "XL") {
        size = x.product.stockXL;
      } else if (x.size == "XXL") {
        size = x.product.stockXXL;
      }

      if (size === 0) {
        isAvailable = 0;
      }

      // Check if offer is active before calculating the offer price
      if (x.product.offerIsActive) {
        totalOfferPrice += x.product.offerPrice * x.count;
      } else {
        totalOfferPrice += x.product.mrp * x.count; // If no offer, use MRP
      }

      totalPrice += x.product.mrp * x.count;
    });
    if (isAvailable == 0) {
      req.flash("error", `  product out of stock. Please update your cart.`);
      return res.redirect("/cart"); // Redirect to cart if any product has stock 0
    }
    let discount = totalPrice - totalOfferPrice;

    return res.render("checkOut", {
      cart,
      totalPrice,
      totalOfferPrice,
      discount,
      addresses,
      wallet,
    });
  } catch (error) {
    console.log(error);
  }
};

// async(req,res)=>{
//   try {
//     req.session.destroy((error)=>{

//       return res.redirect('/')
//     })
//   } catch (error) {
//     console.log(error);

//   }
// }

const checkOutLoadEditAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    res.render("checkOutEditAddress", { address });
  } catch (error) {
    console.log(error);
  }
};

const checkOutEditAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndUpdate(req.params.id, {
      user: req.session.user_id,
      street: req.body.street,
      houseName: req.body.houseName,
      landmark: req.body.landmark,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      zip: req.body.zip,
      addressType: req.body.addressType,
      mobile: req.body.mobile,
      altMobile: req.body.altMobile,
    });

    req.flash("success", "successfully edited");
    res.redirect("/checkOut");
  } catch (error) {
    console.log(error);
  }
};

const chekOutDeleteAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndDelete(req.params.id);

    req.flash("success", "successfully deleted");
    res.redirect("/checkOut");
  } catch (error) {
    console.log(error);
  }
};

const checkOutLoadAddAddress = async (req, res) => {
  try {
    res.render("checkOutAddAddress");
  } catch (error) {
    console.log(error);
  }
};

const checkOutAddAddress = async (req, res) => {
  try {
    const address = new Address({
      user: req.session.user_id,
      street: req.body.street,
      houseName: req.body.houseName,
      landmark: req.body.landmark,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      zip: req.body.zip,
      addressType: req.body.addressType,
      mobile: req.body.mobile,
      altMobile: req.body.altMobile,
    });
    const addressData = await address.save();

    if (addressData) {
      req.flash("success", "successfully added");
      res.redirect("/checkOut");
    }
  } catch (error) {
    console.log(error);
  }
};

const placeOrder = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    const selectedAddress = await Address.findById(req.params.addressId);
    const cartItems = await Cart.find({ user: user._id }).populate("product");

    // for calculating the total price ,total offer to find discount
    let totalOfferPrice = 0;
    let totalPrice = 0;
    const orderProducts = [];
    let offerDiscount = 0;
    let totalMrp = 0;
    cartItems.forEach((item) => {
      const { product, count, size, quantity } = item;
      let applicablePrice = product.mrp; // Default to MRP
      totalMrp += product.mrp * count;
      if (product.offerIsActive == 1 && product.offerPrice) {
        // Check if offer is active
        applicablePrice = product.offerPrice; // Use offer price if active
        offerDiscount += (product.mrp - product.offerPrice) * count;
      }

      totalOfferPrice += applicablePrice * count;
      totalPrice += product.mrp * count;

      const productData = {
        productId: product._id,
        name: product.name,
        mrp: product.mrp,
        offerPrice: product.offerIsActive == 1 ? product.offerPrice : null,
        quantity: count,
        total: applicablePrice * count,
        size: size,
      };

      orderProducts.push(productData);
    });

    const discount = totalPrice - totalOfferPrice;
    let orderTotal = totalOfferPrice;
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, ""); // Current date in YYYYMMDDHHMMSS format
    const randomNum = Math.floor(1000 + Math.random() * 9000); // random 4 digit number
    const orderId = timestamp + randomNum;

    //when coupon is applied calculations according to it
    let couponCode = req.params.couponCode;
    //if no coupon code is applied the params is passed with null string on coupon code
    if (couponCode == "null") {
      couponCode = null;
    }
    const coupon = await Coupon.findOne({ code: couponCode });
    let couponDiscount = 0;
    if (coupon) {
      couponDiscount = Math.round((coupon.discount / 100) * orderTotal);

      if (couponDiscount > coupon.maxDiscount) {
        couponDiscount = coupon.maxDiscount;
      }
      orderTotal = orderTotal - couponDiscount;
    }
    // payment status
    let paymentStatus = "pending";
    let paymentId = "cash on delivery";
    // for redirect for payment
    if (req.params.paymentMethod == "paypal") {
      req.session.placeOrder = {
        addressId: req.params.addressId,
        paymentMethod: req.params.paymentMethod,
        couponCode: req.params.couponCode,
        orderTotal: orderTotal,
      };
      return res.redirect("/paypal");
    }
    let paymentMethod = "COD";
    // for getting manipulations after payment
    if (req.params.paymentMethod == "PAYPAL") {
      paymentId = req.query.paymentId;
      paymentStatus = "completed";
      paymentMethod = "PAYPAL";
    }

    if (req.params.paymentMethod == "WALLET") {
      const walletdata = await Wallet.findOne({ user: req.session.user_id });
      if (orderTotal > walletdata.balance) {
        req.flash("error", "Insufficient balance in your wallet.");
        return res.redirect(`/Checkout`);
      }
      paymentId = `${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8)}`;
      paymentStatus = "completed";
      paymentMethod = "WALLET";

      const wallet = await Wallet.findOneAndUpdate(
        { user: user },
        {
          $push: {
            transaction: {
              amount: -orderTotal, // Update the balance
              date: new Date(),
              transactionMode: "Payment done through Wallet",
            },
          },
          $inc: {
            balance: -orderTotal, // Update the balance
          },
        }
      );
    }

    const newOrder = new Order({
      orderId: orderId,
      user: req.session.user_id,
      userName: user.name,
      email: user.email,
      shippingAddress: {
        street: selectedAddress.street,
        houseName: selectedAddress.houseName,
        landmark: selectedAddress.landmark,
        city: selectedAddress.city,
        district: selectedAddress.district,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        mobile: selectedAddress.mobile,
        altMobile: selectedAddress.altMobile,
        addressType: selectedAddress.addressType,
      },
      products: orderProducts,
      orderTotal: orderTotal,
      appliedCoupon: couponCode,
      couponDiscount: couponDiscount,
      paymentMethod: paymentMethod,
      paymentId: paymentId,
      paymentStatus: paymentStatus,
      offerDiscount: offerDiscount,
      totalMrp: totalMrp,
    });

    await newOrder.save();

    for (let item of cartItems) {
      const product = await Product.findById(item.product._id);
      const cart = await Cart.findOne({
        user: req.session.user_id,
        product: item.product._id,
      });
      if (item.size == "M") {
        product.stockM -= item.count;
        await product.save();
      } else if (item.size == "S") {
        product.stockS -= item.count;
        await product.save();
      } else if (item.size == "L") {
        product.stockL -= item.count;
        await product.save();
      } else if (item.size == "XL") {
        product.stockXL -= item.count;
        await product.save();
      } else if (item.size == "XXL") {
        product.stockXXL -= item.count;
        await product.save();
      }
    }
    // res.redirect(`/paypal`)

    res.redirect(`/orderSuccess/${orderId}`);
  } catch (error) {
    console.log(error);
  }
};

const orderSuccess = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).populate(
      "products.productId"
    );
    res.render("orderSuccess", { order });
  } catch (error) {
    console.log(error);
  }
};

const orders = async (req, res) => {
  try {
    //  const orders=await Order.find({user:req.session.user_id}).populate( 'products.productId')
    const orders = await Order.find({ user: req.session.user_id })
      .populate("products.productId")
      .sort({ orderDate: -1 }); // Sort by createdAt in descending order (-1 for descending, 1 for ascending)

    res.render("orders", { orders });
  } catch (error) {
    console.log(error);
  }
};


const orderDetails=async(req,res)=>{
  try {
    console.log(req.params.orderId);
    
     const order = await Order.findOne({ orderId: req.params.orderId }).populate(
      "products.productId"
    );  
       console.log(order);
     
     res.render('orderDetails',{order});
  } catch (error) {
    console.log(error);
    
  }
}





const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.orderId, {
      orderStatus: "cancelled",
    });
    const orders = await Order.findById(req.params.orderId).populate(
      "products.productId"
    );
    let total = orders.orderTotal;
    if (orders.paymentMethod !== "COD") {
      const wallet = await Wallet.findOneAndUpdate(
        { user: req.session.user_id },
        {
          $push: {
            transaction: {
              amount: total, // Update the balance
              date: new Date(),
              transactionMode: "Refund Due to Order Cancellation",
            },
          },
          $inc: {
            balance: total, // Update the balance
          },
        }
      );
      await Order.findByIdAndUpdate(req.params.orderId, {
        paymentStatus: "Refunded",
      });
    } else {
      await Order.findByIdAndUpdate(req.params.orderId, {
        paymentStatus: "cancelled",
      });
    }

    for (const item of orders.products) {
      let product = await Product.findById(item.productId);
      let cart = await Cart.findOne({
        user: req.session.user_id,
        product: item.productId,
      });

      if (item.size == "M") {
        product.stockM += item.quantity;
        await product.save();
      } else if (item.size == "S") {
        product.stockS += item.quantity;
        await product.save();
      } else if (item.size == "L") {
        product.stockL += item.quantity;
        await product.save();
      } else if (item.size == "XL") {
        product.stockSXL += item.quantity;
        await product.save();
      } else if (item.size == "XXL") {
        product.stockXXL += item.quantity;
        await product.save();
      }
    }

    const myorder = await Order.findById(req.params.orderId);
    res.json({ myorder });
  } catch (error) {
    console.log(error);
  }
};

const ReturnOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.orderId, {
      orderStatus: "Return request applied",
    });

    const orders = await Order.findById(req.params.orderId).populate(
      "products.productId"
    );
    const myorder = await Order.findById(req.params.orderId);
    console.log(myorder);

    res.json({ myorder });
  } catch (error) {
    console.log(error);
  }
};

//  for buying single products or buy option for every products without cart
const singleProductCheckout = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.session.user_id });
    const product = await Product.findById(req.params.productId);
    const wallet = await Wallet.findOne({ user: req.session.user_id });

    let quantity;
    if (req.params.size == "M") {
      quantity = product.stockM;
    } else if (req.params.size == "S") {
      quantity = product.stockS;
    } else if (req.params.size == "L") {
      quantity = product.stockL;
    } else if (req.params.size == "XL") {
      quantity = product.stockXL;
    } else if (req.params.size == "XXL") {
      quantity = product.stockXXL;
    }
    res.render("singleProductCheckout", {
      product,
      addresses,
      size: req.params.size,
      quantity,
      wallet,
    });
  } catch (error) {
    console.log(error);
  }
};

const singleProductOrder = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    const selectedAddress = await Address.findById(req.params.addressId);
    // const cartItems = await Cart.find({ user: user._id }).populate('product');
    const product = await Product.findById(req.params.productId);
    const count = req.params.count;
    // for calculating the total price ,total offer to find discount
    let totalOfferPrice = 0;
    let totalPrice = 0;
    const orderProducts = [];
    let size = req.params.size;
    let discount = 0;
    let offerDiscount = 0;
    let applicablePrice = product.mrp;
    let totalMrp = product.mrp * count;
    if (product.offerIsActive === 1 && product.offerPrice) {
      applicablePrice = product.offerPrice;
      offerDiscount = (product.mrp - product.offerPrice) * count;
    }

    // Update total offer price and discount calculation
    totalOfferPrice = applicablePrice * count;
    discount = totalPrice - totalOfferPrice;

    const productData = {
      productId: product._id,
      name: product.name,
      mrp: product.mrp,
      offerPrice: product.offerIsActive === 1 ? product.offerPrice : null,
      quantity: count,
      total: applicablePrice * count,
      size: req.params.size,
    };

    orderProducts.push(productData);

    // const discount = totalPrice - totalOfferPrice;
    let orderTotal = totalOfferPrice;
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, ""); // Current date in YYYYMMDDHHMMSS format
    const randomNum = Math.floor(1000 + Math.random() * 9000); // random 4 digit number
    const orderId = timestamp + randomNum;

    //when coupon is applied calculations according to it
    let couponCode = req.params.couponCode;
    //if no coupon code is applied the params is passed with null string on coupon code
    if (couponCode == "null") {
      couponCode = null;
    }
    const coupon = await Coupon.findOne({ code: couponCode });
    let couponDiscount = 0;
    if (coupon) {
      couponDiscount = Math.round((coupon.discount / 100) * orderTotal);

      if (couponDiscount > coupon.maxDiscount) {
        couponDiscount = coupon.maxDiscount;
      }
      orderTotal = orderTotal - couponDiscount;
    }
    // payment methord paypal ----------
    if (req.params.paymentMethod == "paypal") {
      req.session.placeOrder = {
        addressId: req.params.addressId,
        productId: req.params.productId,
        count: req.params.count,
        // paymentMethod:req.params.paymentMethod,
        couponCode: req.params.couponCode,
        orderTotal: orderTotal,
        size: req.params.size,
      };

      return res.redirect("/buyNowPaypal");
    }
    let paymentStatus = "pending";

    let paymentMethod = "COD";
    let paymentId = `${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8)}`;
    // for getting manipulations after payment
    if (req.params.paymentMethod == "PAYPAL") {
      paymentId = req.query.paymentId;
      paymentStatus = "completed";
      paymentMethod = "PAYPAL";
    }
    // if the payment methord is wallet
    if (req.params.paymentMethod == "WALLET") {
      const walletdata = await Wallet.findOne({ user: req.session.user_id });
      if (orderTotal > walletdata.balance) {
        req.flash("error", "Insufficient balance in your wallet.");
        return res.redirect(
          `/singleProductCheckout/${req.params.productId}/${req.params.size}`
        );
      }
      paymentId = `${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8)}`;
      paymentStatus = "completed";
      paymentMethod = "WALLET";

      const wallet = await Wallet.findOneAndUpdate(
        { user: user },
        {
          $push: {
            transaction: {
              amount: -orderTotal, // Update the balance
              date: new Date(),
              transactionMode: "Payment done through Wallet",
            },
          },
          $inc: {
            balance: -orderTotal, // Update the balance
          },
        }
      );
    }

    const newOrder = new Order({
      orderId: orderId,
      user: req.session.user_id,
      userName: user.name,
      email: user.email,
      shippingAddress: {
        street: selectedAddress.street,
        houseName: selectedAddress.houseName,
        landmark: selectedAddress.landmark,
        city: selectedAddress.city,
        district: selectedAddress.district,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        mobile: selectedAddress.mobile,
        altMobile: selectedAddress.altMobile,
        addressType: selectedAddress.addressType,
      },
      products: orderProducts,
      orderTotal: orderTotal,
      appliedCoupon: couponCode,
      couponDiscount: couponDiscount,
      offerDiscount: offerDiscount,
      paymentId: paymentId,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      totalMrp: totalMrp,
    });

    await newOrder.save();

    const cart = await Cart.findOne({
      user: req.session.user_id,
      product: product._id,
    });

    if (size == "M") {
      product.stockM -= count;
      await product.save();
    } else if (size == "S") {
      product.stockS -= count;
      await product.save();
    } else if (size == "L") {
      product.stockL -= count;
      await product.save();
    } else if (size == "XL") {
      product.stockSXL -= count;
      await product.save();
    } else if (size == "XXL") {
      product.stockXXL -= count;
      await product.save();
    }
    res.redirect(`/orderSuccess/${orderId}`);
  } catch (error) {
    console.log(error);
  }
};

const singleCheckOutLoadEditAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    const product = await Product.findById(req.params.productId);

    res.render("singleCheckOutEditAddress", {
      address,
      product,
      size: req.params.size,
    });
  } catch (error) {
    console.log(error);
  }
};

const singleCheckOutEditAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndUpdate(req.params.id, {
      user: req.session.user_id,
      street: req.body.street,
      houseName: req.body.houseName,
      landmark: req.body.landmark,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      zip: req.body.zip,
      addressType: req.body.addressType,
      mobile: req.body.mobile,
      altMobile: req.body.altMobile,
    });

    req.flash("success", "successfully edited");
    res.redirect(
      `/singleProductCheckOut/${req.params.productId}/${req.params.size}`
    );
  } catch (error) {
    console.log(error);
  }
};

const singleCheckOutLoadAddAddress = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    console.log(req.params.size);

    res.render("singleCheckOutAddAddress", { product, size: req.params.size });
  } catch (error) {
    console.log(error);
  }
};

const singleCheckOutAddAddress = async (req, res) => {
  try {
    const address = new Address({
      user: req.session.user_id,
      street: req.body.street,
      houseName: req.body.houseName,
      landmark: req.body.landmark,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      zip: req.body.zip,
      addressType: req.body.addressType,
      mobile: req.body.mobile,
      altMobile: req.body.altMobile,
    });
    const addressData = await address.save();

    if (addressData) {
      req.flash("success", "successfully added");
      res.redirect(
        `/singleProductCheckOut/${req.params.productId}/${req.params.size}`
      );
    }
  } catch (error) {
    console.log(error);
  }
};

const addToWishlist = async (req, res) => {
  try {
    if (!req.session.user_id) {
      req.flash(
        "error",
        "You need to be logged in to add items to thewishlist ."
      );
      return res.json({ status: "notLogedIn" });
    }

    const isWishlisted = await Wishlist.findOne({
      user: req.session.user_id,
      product: req.params.productId,
    });

    if (isWishlisted) {
      await Wishlist.findOneAndDelete({
        user: req.session.user_id,
        product: req.params.productId,
      });
      return res.json({ status: "removed" });
    } else {
      const wishlist = new Wishlist({
        user: req.session.user_id,
        product: req.params.productId,
        size: req.params.size,
      });
      wishlist.save();

      return res.json({ status: "added" });
    }
  } catch (error) {
    console.log(error);
  }
};

const loadWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.find({ user: req.session.user_id }).populate(
      "product"
    );
    wishlist = await Promise.all(
      wishlist.map(async (cur) => {
        const inCart = await Cart.findOne({
          user: req.session.user_id,
          product: cur.product._id,
        });

        cur.product.inCart = !!inCart;

        return cur;
      })
    );

    res.render("wishlist", { wishlist });
  } catch (error) {
    console.log(error);
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    await Wishlist.findByIdAndDelete(req.params.wishlistId);
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error);
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
  forgotPasswordEmail,
  ForgotPasswordOtp,
  verifyForgotPasswordOtp,
  loadForgotPasswordOtp,
  forgotPasswordresendOtp,
  loadChangePassword,
  changePassword,
  addToCart,
  removeFromCart,
  loadCart,
  productCount,
  accountDetails,
  updateDetails,
  logout,
  loadAddress,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
  checkOut,
  checkOutEditAddress,
  checkOutLoadEditAddress,
  chekOutDeleteAddress,
  checkOutLoadAddAddress,
  checkOutAddAddress,
  placeOrder,
  orders,
  orderDetails,
  orderSuccess,
  cancelOrder,
  singleProductCheckout,
  singleProductOrder,
  singleCheckOutLoadEditAddress,
  singleCheckOutEditAddress,
  singleCheckOutLoadAddAddress,
  singleCheckOutAddAddress,
  addToWishlist,
  loadWishlist,
  removeFromWishlist,
  ReturnOrder,
};
