var express = require('express');
var router = express.Router();
const mysql = require("mysql");
var auth = require('../config/auth');
var isUser = auth.isUser;
var Parcels = require('../models/parcels');
var Travellers = require('../models/travellers');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
        user: 'victormutua71@gmail.com',
        pass: 'vic0710443487'
    }
});

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '/victor.mwendwa.18/',
    database: 'tms'
})

/*
 * GET /
 */
router.get('/', (req, res)=>{
    res.render('main_pages/about', {
        title: 'About Us'
    });
});

router.get('/services', (req, res)=>{
    res.render('main_pages/services',{
        title: "Services"
    })
});

router.get('/account', (req,res)=>{

    if(res.locals.user===null){
        req.flash('danger', 'Please login!')
        res.redirect('/users/login')
    }else{
        var user = res.locals.user;

        var id = res.locals.user[0].customerID;
        var routes = [];
        var user;//locals.user
        var parcel = [];
        var traveller = [];
        var carHire = [];

        Parcels.findOne({customerId: id}, (err, result)=>{
            if(err) throw err;
            console.log(result);
            parcel.push(result);

            parcel.forEach((data)=>{
                
                if(data.mailed===null || data.mailed===undefined && data.status==='pick up'){
                    const mailOptions = {
                        from: 'victormutua71@gmail.com', // sender address
                        to: res.locals.user[0].email, // list of receivers
                        subject: 'Subject of your email', // Subject line
                        html: '<p>Your html here</p>'// plain text body
                    };
                    transporter.sendMail(mailOptions, function (err, info) {
                        if(err)
                        console.log(err)
                        else
                        console.log('Success mailing', info);
                        Parcels.findOneAndUpdate({_id: data._id}, {$set: {mailed: 'mailed'}}, (err, resultMail)=>{
                            if(err) throw err;
                            console.log('Mailed result', resultMail);
                        })
                    });
                } else {
                    console.log('Mail was sent!')
                }
            })
            

            var sql1 = `SELECT * FROM routes;`;
            db.query(sql1, (err, result)=>{
                if(err) throw err;
                routes.push(result[0].routeFrom,result[0].routeTo);

                Travellers.findOne({customerID: id}, (err, result)=>{
                    if(err) throw err;
                    traveller.push(result);
                    console.log('Traveller',result)

                    var sql2 = `SELECT * FROM carhire WHERE customerID=?;`;
                    db.query(sql2, id, (err, result)=>{
                        if(err) throw err;
                        console.log(result);
                        result.forEach((data)=>{
                            carHire.push(data);
                        })
                        

                        console.log("Routes",routes)
                        res.render('main_pages/account', {
                            title: 'Account',
                            user: user,
                            parcel: parcel,
                            routes: routes,
                            traveller: traveller,
                            carHire: carHire
                        })
                    })
                })
            })

        })
    }
});

router.get('/contacts', (req,res)=>{
    res.render('main_pages/contacts', {
        title: 'Contact Us'
    })
});

// Exports
module.exports = router;