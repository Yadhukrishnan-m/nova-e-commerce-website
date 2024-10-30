

const User = require("../../models/usermodel");
const Admin = require("../../models/adminmodel");
const Category = require("../../models/category");
const Product = require("../../models/product");
const Address = require("../../models/address");
const Order = require("../../models/order");
const Wallet = require("../../models/wallet");

const fs = require("fs");
const path = require("path");


const productOfferLoad = async (req, res) => {
    try {
      const products = await Product.find();
      res.render("productOffers", { products });
    } catch (error) {
      console.log(error);
    }
  };
  
  const productOfferEditLoad = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
  
      res.render("productOfferEdit", { product });
    } catch (error) {
      console.log();
    }
  };
  
  const productOfferEdit = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      product.discount = req.body.discount;
  
      const offerPrice = Math.round(
        product.mrp - product.mrp * (req.body.discount / 100)
      );
  
      product.offerIsActive = 1;
      product.offerPrice = offerPrice;
      product.save();
      //  await Product.findByIdAndUpdate(req.params.id,{discount:req.body.discount,offerExpiry:new Date(req.body.date),offerIsActive:1})
      res.redirect("/admin/productOffer");
    } catch (error) {}
  };
  
  const productOfferActive = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
  
      product.offerIsActive = product.offerIsActive == 1 ? 0 : 1;
      product.save();
      res.json({ success: true, offerIsActive: product.offerIsActive });
    } catch (error) {
      console.log(error);
    }
  };
  
  const categoryOfferLoad = async (req, res) => {
    try {
      const category = await Category.find();
      res.render("categoryoffers", { category });
    } catch (error) {
      console.log(error);
    }
  };
  
  const categoryOfferEditLoad = async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
  
      res.render("categoryOfferEdit", { category });
    } catch (error) {
      console.log(error);
    }
  };
  
  const categoryOfferEdit = async (req, res) => {
    try {
      const { discount } = req.body;
  
      const products = await Product.find({ category: req.params.id });
  
      for (let product of products) {
        let originalPrice = product.mrp;
        let offerPrice = originalPrice - originalPrice * (discount / 100);
        offerPrice = Math.round(offerPrice);
  
        const productTest = await Product.updateOne(
          { _id: product._id },
          {
            $set: {
              discount: discount,
              offerPrice: offerPrice,
            },
          }
        );
        console.log(productTest);
      }
  
      req.flash("successMsg", "successfully Added");
      res.redirect("/admin/categoryOffer");
    } catch (error) {}
  };
  
  const categoryOfferActivate = async (req, res) => {
    try {
      if (req.params.status == 1) {
        await Product.updateMany(
          { category: req.params.id },
          {
            $set: {
              offerIsActive: 1,
            },
          }
        );
      } else {
        await Product.updateMany(
          { category: req.params.id },
          {
            $set: {
              offerIsActive: 0,
            },
          }
        );
      }
      req.flash("successMsg", "successfully updated");
      res.redirect("/admin/categoryOffer");
    } catch (error) {
      console.log(error);
    }
  };

  module.exports={
    productOfferLoad,
    productOfferEditLoad,
    productOfferEdit,
    productOfferActive,
    categoryOfferLoad,
    categoryOfferEditLoad,
    categoryOfferEdit,
    categoryOfferActivate,
  }