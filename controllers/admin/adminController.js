
  const User=require("../../models/usermodel")
  const Admin=require("../../models/adminmodel")
  const Category=require("../../models/category")
  const Product=require('../../models/product')
  const Address=require('../../models/address');
  const Order=require('../../models/order');
  const Wallet=require('../../models/wallet');

  const fs=require('fs');
const path=require('path')

  const loadLogin=async(req,res)=>{
      try {
        
          
      res.render('adminLogin');
        
          
      } catch (error) {
          console.log(error);
          
      }
  }
  //to crypt the password 
  const bcrypt=require('bcrypt');
const { ifError } = require("assert");
// const product = require("../models/product");
  // const securepassword=async(password)=>{
  //     try {
  //         const passwordHash = await bcrypt.hash(password,10);
  //         return passwordHash;
  //     } catch (error) {
  //         console.log(error.message);
          
  //     }
  // }

  const verifyAdmin=async(req,res)=>{
      try {
            const email=req.body.email;
            const password=req.body.password;
            
            const adminData=await Admin.findOne({email:email}); 
            if (adminData) {
              const passwordMatch=await bcrypt.compare(password,adminData.password);
                if (passwordMatch) {
                 

                  req.session.admin_id=adminData._id
                  return res.json({ success: true, });
                  
                }else{
                   return res.json({ success: false,message:'Email and passcode is incorrect' });
                }
              
            }else{
              return res.json({ success: false,message:'Email and passcode is incorrect' });
              // res.render('adminLogin',{message:'error'})
            }
      } catch (error) {
          console.log(error);
      }
  }


  // to load users page
  const loadusers=async(req,res)=>{
    try {
      const userData = await User.find();
      res.render('users',{userData});
    } catch (error) {
      console.log(error);
    }
  }

// to block and unblock uer
  const userStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId); 

        if (!user) {
            req.flash('errorMsg', 'User not found');
            return res.redirect('/admin/users'); 
        }

        user.is_active = user.is_active === 1 ? 0 : 1;
        await user.save(); // Save the updated user

        req.flash('successMsg', `User status updated successfully`);
        res.redirect('/admin/users');
    } catch (error) {
        console.log(error);
        req.flash('errorMsg', 'An error occurred while updating user status');
        res.redirect('/admin/users');
    }
};


// load category
const loadCategory=async(req,res)=>{
  try {
    const categoryData= await Category.find();
    res.render("category",{categoryData});
  } catch (error) {
    console.log(error);
   
  }
}

const listCategory=async(req,res)=>{
  try {
    const categoryId=req.params.id;
    const category=await Category.findById(categoryId);

    if (!category) {
      req.flash('errorMsg', 'category not found');
      return res.redirect('/admin/category'); 

   

  }

  category.is_active = category.is_active === 1 ? 0 : 1;
  await category.save(); // Save the updated user

  req.flash('successMsg', `category status updated successfully`);
  res.redirect('/admin/category');


  } catch (error) {
    console.log(error);
    
  }
}

const addCategory=async(req,res)=>{
  try {
    const categoryName=req.body.categoryName.trim();
    const description=req.body.description;

    const category=new Category({
      name:categoryName,
      description:description
    })
    

  const categoryData= await Category.findOne({name:{$regex: new RegExp(`^${categoryName}$`, 'i')}});
    if(categoryData){
      req.flash('errorMsg', 'category alredy exist');
      res.redirect('/admin/category');
    }else{
       await category.save();
       console.log('category sucessfully saved');
       req.flash('successMsg', 'category sucessfully added');
       res.redirect('/admin/category');
          }
  } catch (error) {
    console.log(error);
    
  }
}

const loadEditCategory=async(req,res)=>{
  try {
    const category_id=req.params.id;    
    const category=await Category.findById(category_id);

    if (!category) {
      req.flash('errorMsg','category not found')
      res.redirect('/admin/category')
    }
    else{
      res.render('categoryEdit',{category})
    }

  } catch (error) {
    console.log(error);
  }
}

const editCategory=async(req,res)=>{
  try {
  const   categoryId=req.params.id;
   const  categoryName=req.body.categoryName;
  const   description=req.body.description;
    const category = await Category.findById(categoryId);

    if (!category) {
      req.flash('errorMsg','category not found')
    return  res.redirect('/admin/category');
    }

  
    //  update the category and save it 
    category.name = categoryName;
    category.description = description;

    await category.save();
    req.flash('successMsg','sucessfully edited ' )
  
    
    return  res.redirect('/admin/category');

  } catch (error) {
    console.log(error);
     
  }
}

const loadProduct=async(req,res)=>{
  try {
    const products=await Product.find().populate('category');
    
    res.render('product',{products})
  } catch (error) {
    console.log(error);
    
  }
}
const listProduct=async(req,res)=>{
  try {
    const productId=req.params.id;
    const product=await Product.findById(productId);
    
    if (!product) {
      req.flash('errorMsg', 'product not found');
      return res.redirect('/admin/product'); 

   

  }

  product.is_active = product.is_active === 1 ? 0 : 1;
  await product.save(); // Save the updated user

  req.flash('successMsg', `product status updated successfully`);
  res.redirect('/admin/product');


  } catch (error) {
    console.log(error);
    
  }
}

const loadAddProduct=async(req,res)=>{
  try {
    const categories=await Category.find();
   
   
    
    res.render('addProduct',{categories})
  } catch (error) {
    console.log(error);
    
  }
}

const addProduct=async(req,res)=>{
  try {
    const { name, description, category, mrp,discount,stock_s,stock_m,stock_l,stock_xl,stock_xxl ,specification} = req.body
   let stockS=stock_s ,stockM=stock_m,stockL=stock_l,stockXL=stock_xl,stockXXL=stock_xxl
    
    const image = req.files.map(file => '/productImages/' + file.filename); 

 

   const   offerPrice = Math.floor(mrp - (mrp * (discount / 100)));
   
    const newProduct = new Product({
      name,
      description,
      category,
      mrp,
      offerPrice,
      stockS,stockM,stockL,stockXL,stockXXL,
      image,
      specification,
      discount,
     offerIsActive: true 
  });
  await newProduct.save();
  req.flash('successMsg', 'Product added successfully');
  res.redirect('/admin/product');  

  } catch (error) {
    console.log(error);
    
  }
}


const loadEditProduct=async(req,res)=>{
  try {
   const productId=req.params.id;
const product=await Product.findById(productId).populate('category');
const categories=await Category.find();

    res.render('editProduct',{product,categories});
  } catch (error) {
    console.log(error);
    
  }
}

const editProduct = async (req, res) => {
  try {
    const { name, description, category, mrp, discount, stock_s,stock_m,stock_l,stock_xl,stock_xxl, specification } = req.body;
    const image = req.files.map(file => '/productImages/' + file.filename);
    
    const product = await Product.findById(req.params.id);
    const   offerPrice = Math.floor(mrp - (mrp * (discount / 100)));

    const oldImages = product.image;
    const publicPath = path.join(__dirname, '../public');

    // Get the images marked for removal
    const imagesToRemove = req.body.removeImages || []; // This will be an array of image paths

    // Remove the selected images from the `product.image` array
    const remainingImages = oldImages.filter(img => !imagesToRemove.includes(img));

    // Delete the old images from the folder
    imagesToRemove.forEach(imgPath => {
      const fullImagePath = path.join(publicPath, imgPath);
      if (fs.existsSync(fullImagePath)) {
        fs.unlinkSync(fullImagePath); // Delete the image file
      } else {
        console.log(`Image not found: ${fullImagePath}`);
      }
    });

    // Update the product details
    product.name = name;
    product.description = description;
    product.category = category;
    product.mrp = mrp;
    product.offerPrice = offerPrice;
    product.stockS = stock_s;
    product.stockM = stock_m;
    product.stockL = stock_l;
    product.stockXL = stock_xl;
    product.stockXXL = stock_xxl;
    product.specification = specification;

    // Combine remaining images with new ones, if any
    product.image = [...remainingImages, ...image];
    product.discount = discount;
    
    await product.save();

    req.flash('successMsg', 'Successfully updated');
    return res.redirect('/admin/product');
  } catch (error) {
    console.log(error);
    res.redirect('/admin/product');
  }
};


const orders=async(req,res)=>{
  try {
    const orders=await Order.find().populate( 'products.productId').sort({ orderDate: -1 })
    res.render('orders',{orders});
  } catch (error) {
    console.log(error);
  }
}

const changeStatus=async(req,res)=>{
  try { 
   await Order.findByIdAndUpdate(req.params.orderId,{orderStatus:req.params.status})  
   const order=await Order.findById(req.params.orderId);
    const user=order.user
    
      const total=order.orderTotal
    if (order.paymentMethod!=="COD") {
      if (order.orderStatus=="cancelled") {
        
        
        const wallet=await Wallet.findOneAndUpdate({user:user},{ $push: { 
          transaction:{
              amount: total, // Update the balance
            date:new Date(),
                     transactionMode:'Refund Due to Order Cancellation'
          }
        },
        $inc: {  
          balance: total // Update the balance
        }
           })
        await Order.findByIdAndUpdate(req.params.orderId,{paymentStatus:'Refunded',});

      }else  if (order.orderStatus==="Return success") {
        const wallet=await Wallet.findOneAndUpdate({user:user},{ $push: { 
          transaction:{
              amount: total, // Update the balance
            date:new Date(),
                     transactionMode:'Refund Due to Order Return'
          }
        },
        $inc: { 
          balance: total // Update the balance
        }
           })
        await Order.findByIdAndUpdate(req.params.orderId,{paymentStatus:'Refunded',});

      } 


    }else{
      if (order.orderStatus==="Return success") {
        const wallet=await Wallet.findOneAndUpdate({user:user},{ $push: { 
          transaction:{
              amount: total, // Update the balance
            date:new Date(),
                     transactionMode:'Refund Due to Order Return'
          }
        },
        $inc: { 
          balance: total // Update the balance
        }
           })
        await Order.findByIdAndUpdate(req.params.orderId,{paymentStatus:'Refunded',});

      } else if (order.orderStatus==="cancelled") {
        await Order.findByIdAndUpdate(req.params.orderId,{paymentStatus:'cancelled',});
      }
    }
       if (order.orderStatus==="delivered") {
     
        await Order.findByIdAndUpdate(order._id,{paymentStatus:"completed"})  
       }

   res.redirect('/admin/orders')
 
    
    
  } catch (error) {
    console.log(error);
    
  }
}


const logout=async(req,res)=>{
  try {
    req.session.destroy((error)=>{
      res.clearCookie('admin_session');
      return res.redirect('/admin')
    })
   
    
  } catch (error) {
   console.log(error);
    
  }

}

const productOfferLoad=async(req,res)=>{
  try {
    const products=await Product.find()
      res.render('productOffers',{products});
  } catch (error) {
    console.log(error);
  }
}

const productOfferEditLoad=async(req,res)=>{
  try {
 const  product= await Product.findById(req.params.id)

 
    res.render('productOfferEdit',{product})
  } catch (error) {
    console.log();
    
  }
}

const productOfferEdit=async(req,res)=>{
  try {
    const product=await Product.findById(req.params.id);
    product.discount=req.body.discount;


    const   offerPrice = Math.round(product.mrp - (product.mrp * (req.body.discount / 100)));

    
    product.offerIsActive=1;
    product.offerPrice= offerPrice;
    product.save()
    //  await Product.findByIdAndUpdate(req.params.id,{discount:req.body.discount,offerExpiry:new Date(req.body.date),offerIsActive:1})
     res.redirect('/admin/productOffer')
  } catch (error) {
 
  }
}


const productOfferActive=async(req,res)=>{
  try {
     const product=await Product.findById(req.params.id);
     
     
     product.offerIsActive= product.offerIsActive==1 ? 0:1;
     product.save();
    res.json({success:true,offerIsActive:product.offerIsActive})
  } catch (error) {
    console.log(error);
  }
}


const categoryOfferLoad=async(req,res)=>{
  try {
   const category=await Category.find();
   res.render('categoryoffers',{category});
  } catch (error) {
    console.log(error);
    
  }
}

const categoryOfferEditLoad=async(req,res)=>{
  try {
    const category=await Category.findById(req.params.id);
    
    res.render('categoryOfferEdit',{category});
    
  } catch (error) {
    console.log(error);
    
  }
}

const categoryOfferEdit=async(req,res)=>{
  try {
    const { discount,} = req.body; 

    const products = await Product.find({ category: req.params.id });

    for (let product of products) {

      let originalPrice = product.mrp; 
      let offerPrice = originalPrice - (originalPrice * (discount / 100));
      offerPrice = Math.round(offerPrice);
      // console.log(`Updating product ID: ${product._id} | Original Price: ${originalPrice} | Offer Price: ${offerPrice}`);

    const productTest=  await Product.updateOne(
        { _id: product._id }, 
        {
          $set: {
            discount: discount,
            offerPrice: offerPrice,
          }
        }
      );
      console.log(productTest);
    }
  
   
    
         req.flash('successMsg','successfully Added')
     res.redirect('/admin/categoryOffer')
  } catch (error) {
 
  }
}


const categoryOfferActivate=async(req,res)=>{
  try {
        if(req.params.status==1){
          await Product.updateMany(
            { category: req.params.id}, 
            {
              $set: {
                offerIsActive: 1, 
              }
            }
          );
        }else{
          await Product.updateMany(
            { category: req.params.id}, 
            {
              $set: {
                offerIsActive: 0, 
              }
            }
          );
        }
        req.flash('successMsg','successfully updated')
        res.redirect('/admin/categoryOffer')
    
  } catch (error) {
    console.log(error);
    
  }
}

  module.exports={
      loadLogin,
      verifyAdmin,
      loadusers,
      userStatus,
      loadCategory,
      addCategory,
      listCategory,
      loadEditCategory,
      editCategory,
      loadProduct,
      listProduct,
      loadAddProduct,
      addProduct,
      loadEditProduct,
      editProduct,
      orders,
      changeStatus,
      logout,
      productOfferLoad,
      productOfferEditLoad,
      productOfferEdit,
      productOfferActive,
      categoryOfferLoad,
      categoryOfferEditLoad,
      categoryOfferEdit,
      categoryOfferActivate
  }
