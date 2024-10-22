
const User=require("../../models/usermodel")
const Admin=require("../../models/adminmodel")
const Category=require("../../models/category")
const Product=require('../../models/product')
const Address=require('../../models/address');
const Order=require('../../models/order');
const Wallet=require('../../models/wallet');
const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const fs = require('fs');


  // to load the dashboard
  const loadDashboard=async(req,res)=>{
    try {
      
       let overallSales = await Order.aggregate([
            {
              $group: {
                _id: null,
                totalSalesCount: { $sum: 1 }, // Count total number of sales 
                totalDiscount: { 
                  $sum: {
                    $add: ['$couponDiscount', '$offerDiscount'] 
                  }
                },
                totalOrderAmount: { $sum: '$orderTotal' } 
              }
            }
          ]);
        
         if (overallSales.length==0) {
            overallSales.totalSalesCount=0,
            overallSales.totalDiscount= 0,
            overallSales.totalOrderAmount= 0
         }else{
            overallSales=overallSales[0]
         }

      res.render('dashboard',{ overallSales});
    } catch (error) {
      console.log(error);
    }
  }

  const loadSalesReport=async(req,res)=>{
    try {
        const { startDate, endDate } = req.params;

       
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0); 
        end.setHours(23, 59, 59, 0);
        const salesData = await Order.aggregate([
          {
            $match: {
              orderDate: { $gte: start, $lte: end },
             
            }
            
          }, 
       
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
              orders: { $sum: 1 },  
              revenue: { $sum: '$orderTotal' }, 
              discount: { $sum: { $add: ['$couponDiscount', '$offerDiscount'] } }, 
              couponDiscount:{$sum:'$couponDiscount'},
              offerDiscount:{$sum:'$offerDiscount'},
              mrp:{$sum:"$totalMrp"}
            }
          },
          { $sort: { _id: 1 } } 
        ]);


        let totalOrder=0
       let  totalRevenue=0
       let   totalDiscount=0
       let totalCouponDiscount=0
       let totalOfferDiscount=0
       let totalMrp=0

     
          if(salesData.length>0){
            salesData.forEach(element=> {   
        totalOrder+=element.orders
        totalRevenue+=element.revenue
        totalDiscount+=element.discount
        totalCouponDiscount+=element.couponDiscount
        totalOfferDiscount+=element.offerDiscount     
        totalMrp+=element.mrp
         });
          }
        

        res.render('salesReport', { salesData, startDate, endDate , totalOrder,
            totalRevenue,
            totalDiscount,
            totalCouponDiscount,
            totalOfferDiscount,
            totalMrp,
           
        });
    } catch (error) {
        console.log(error);
        
    }
  }

  const downloadPdf=async(req,res)=>{
    try {
      
      const { startDate, endDate } = req.params;

       
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0); 
      end.setHours(23, 59, 59, 0);
    
      
      const salesData=await Order.aggregate([
        {
          $match:{orderDate:{$gte:start,$lte:end}}
        },
        {
          $group:{
         _id:{ $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
         orders:{$sum:1},
         revenue: { $sum: '$orderTotal' }, 
         discount: { $sum: { $add: ['$couponDiscount', '$offerDiscount'] } }, 
         couponDiscount:{$sum:'$couponDiscount'},
         offerDiscount:{$sum:'$offerDiscount'},
         mrp:{$sum:"$totalMrp"}
          }
        }
      ])
   
      

      let totalOrder=0
      let  totalRevenue=0
      let   totalDiscount=0
      let totalCouponDiscount=0
      let totalOfferDiscount=0
      let totalMrp=0
  

      if(salesData.length>0){
        salesData.forEach(element=> {   
    totalOrder+=element.orders
    totalRevenue+=element.revenue
    totalDiscount+=element.discount
    totalCouponDiscount+=element.couponDiscount
    totalOfferDiscount+=element.offerDiscount     
    totalMrp+=element.mrp
     });
      }
       
      const doc = new PDFDocument();
      const filePath = `./salesReport_${startDate}_to_${endDate}.pdf`;
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

        doc.fontSize(18).text('Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Start Date: ${startDate}`, { align: 'left' });
        doc.text(`End Date: ${endDate}`, { align: 'left' });
        doc.moveDown();
        
        doc.text(`Total Orders: ${totalOrder}`);
        doc.text(`Total MRP: ${totalMrp}`);
        doc.text(`Total Discount: ${totalDiscount}`);
        doc.text(`Total Coupon Discount: ${totalCouponDiscount}`);
        doc.text(`Total Offer Discount: ${totalOfferDiscount}`);
        doc.text(`Final Revenue: ${totalRevenue}`);
        doc.moveDown();
      
        // Add sales data table
        doc.text('Detailed Sales Data:');
        doc.moveDown();
        salesData.forEach((data) => {
          doc.text(`Date: ${data._id}`);
          doc.text(`Orders: ${data.orders}`);
          doc.text(`Revenue: ${data.revenue}`);
          doc.text(`Discount: ${data.discount}`);
          doc.text(`Coupon Discount: ${data.couponDiscount}`);
          doc.text(`Offer Discount: ${data.offerDiscount}`);
          doc.text(`MRP: ${data.mrp}`);
          doc.moveDown();
        });
      
      doc.end();
      writeStream.on('finish', () => {
        res.download(filePath, `salesReport_${startDate}_to_${endDate}.pdf`, (err) => {
          if (err) {
            console.error('Error sending file:', err);
          } else {
            console.log('File sent successfully.');
            
          
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
              
              } 
            });
          }
        });
      });

    } catch (error) {
      console.log(error);
       
    }
  }


  const downloadExcel=async(req,res)=>{
    try {

        
      const { startDate, endDate } = req.params;

       
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0); 
      end.setHours(23, 59, 59, 0);
    
      
      const salesData=await Order.aggregate([
        {
          $match:{orderDate:{$gte:start,$lte:end}}
        },
        {
          $group:{
         _id:{ $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
         orders:{$sum:1},
         revenue: { $sum: '$orderTotal' }, 
         discount: { $sum: { $add: ['$couponDiscount', '$offerDiscount'] } }, 
         couponDiscount:{$sum:'$couponDiscount'},
         offerDiscount:{$sum:'$offerDiscount'},
         mrp:{$sum:"$totalMrp"}
          }
        }
      ])
   
      

      let totalOrder=0
      let  totalRevenue=0
      let   totalDiscount=0
      let totalCouponDiscount=0
      let totalOfferDiscount=0
      let totalMrp=0
  

      if(salesData.length>0){
        salesData.forEach(element=> {   
    totalOrder+=element.orders
    totalRevenue+=element.revenue
    totalDiscount+=element.discount
    totalCouponDiscount+=element.couponDiscount
    totalOfferDiscount+=element.offerDiscount     
    totalMrp+=element.mrp
     });
      }


      const wb = xlsx.utils.book_new();
    const wsData = [
      ['Sales Report'], // Title
      [],
      ['Start Date', startDate],  // Start and End Dates
      ['End Date', endDate],
      [],
      ['Total Orders', totalOrder],
      ['Total MRP', totalMrp],
      ['Total Discount', totalDiscount],
      ['Total Coupon Discount', totalCouponDiscount],
      ['Total Offer Discount', totalOfferDiscount],
      ['Final Revenue', totalRevenue],
      [],
      ['Detailed Sales Data'],
      ['Date', 'Orders', 'Revenue', 'Discount', 'Coupon Discount', 'Offer Discount', 'MRP'], // Headers for data
    ];

    salesData.forEach((data) => {
      wsData.push([
        data._id, // Date
        data.orders,
        data.revenue,
        data.discount,
        data.couponDiscount,
        data.offerDiscount,
        data.mrp
      ]);
    });

    const ws = xlsx.utils.aoa_to_sheet(wsData);

    xlsx.utils.book_append_sheet(wb, ws, 'Sales Report');

   
    const filePath = `./salesReport_${startDate}_to_${endDate}.xlsx`;

 
    xlsx.writeFile(wb, filePath);

 
    res.download(filePath, `salesReport_${startDate}_to_${endDate}.xlsx`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      } else {
        console.log('File sent successfully.');

      
        fs.unlink(filePath, (unlinkErr) => {
         
        });
      }
    });


      
    } catch (error) {
      console.log(error);
      
    }
  }

  module.exports={
    loadDashboard,
    loadSalesReport,
    downloadPdf,
    downloadExcel
  }   