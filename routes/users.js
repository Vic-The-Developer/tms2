var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcrypt');
var path = require('path');
var {body, validationResult } = require("express-validator");
var formidable = require('formidable');
var fs = require('fs-extra');
var os = require('os');
const mysql = require("mysql");
const Travellers = require('../models/travellers');
const Parcels = require('../models/parcels');
const Mpesa = require("mpesa-api").Mpesa;
const { time } = require('console');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '/victor.mwendwa.18/',
    database: 'tms'
})
os.tmpDir = os.tmpdir;

/*
 * GET register
 */
router.get('/register', function (req, res) {

    res.render('main_pages/register', {
        title: 'Register'
    });

});


/*
 * POST register
 */
router.post('/register', function (req, res) {

    var fName = req.body.fName;
    var lName = req.body.lName;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
    var phoneNumber = req.body.phoneNumber;

    req.checkBody('fName', 'Name is required!').notEmpty();
    req.checkBody('lName', 'Name is required!').notEmpty();
    req.checkBody('email', 'Email is required!').isEmail();
    req.checkBody('username', 'Username is required!').notEmpty();
    req.checkBody('password', 'Password is required!').notEmpty();
    req.checkBody('password2', 'Passwords do not match!').equals(password);
    req.checkBody('phoneNumber', 'Phone number is required').isMobilePhone('en-KE');

    var errors = req.validationErrors();

    if (errors) {
        res.render('main_pages/register', {
            errors: errors,
            user: null,
            title: 'Register'
        });
    } else {
        console.log(req.body);

        var sql = `SELECT * FROM customers WHERE email = ? OR username = ?;`;
        var email = req.body.email;

        var username = req.body.username;
        db.query(sql,[email,username], (err,user)=>{
            console.log(user);
            
            if(user.length!==0){
                console.log("User already exists!");
                req.flash('danger', 'Username exists, choose another!');
                res.redirect('/users/register');
            }else{
                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(password, salt, function (err, hash) {
                        if (err)
                            console.log(err);
        
                        password = hash;
        
                        var sql = `INSERT INTO customers(firstname,lastname,username,email,phonenumber,password) VALUES (?);`;
                        var values = [fName,lName,username,email,phoneNumber,password];
                        db.query(sql,[values],(err,result)=>{
                            if(err) throw err;
                            console.log(result);
                            req.flash('success', 'You are now registered!');
                            res.render('main_pages/profile', {
                                title: 'Profile Photo',
                                user: null,
                                email: email
                            });
                        })
                    })
                });
            }
        })
    }

});

/*
 *Upload photo 
*/
router.post('/profile',(req,res)=>{
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files)=>{
        console.log(files);

        var photo = files.pic.originalFilename;

        if(!Array.isArray(files.pic)){
            console.log(files);
            let oldPath = files.pic.filepath;
            let newPath = path.join( 'public/users', files.pic.originalFilename);

            fs.rename(oldPath, newPath, err => {
                if(err) throw err;
                let email = fields.email;
                photo = files.pic.originalFilename;
                console.log('File uploaded and moved');
                var sql = `UPDATE customers SET photo = ? WHERE email = ?;`;
                var values = [photo, email];
                db.query(sql,values,(err,result)=>{
                    if(err) throw err;
                    console.log(result);
                    req.flash('success', 'Profile photo uploaded!');
                    res.redirect('/users/login')
                })
            })
        }else{
            console.log("Can't upload multiple files!");
            res.redirect('/users/register');
            // for(let value of files.img){
            //     let oldPath = value.filepath;
            //     let newPath = path.join(__dirname, 'public\images', value.originalFilename);

            //     n.push(new Object({
            //         'file_name': value.name,
            //         'file_type': value.type
            //     }));

            //     fs.rename(oldPath, newPath, err => {
            //         if(err) throw err;
            //         console.log('File uploaded and moved');
            //     })
            // }
        }
    })
})
router.get('/profile',(req,res)=>{
    res.render('main_pages/profile',{
        title: "Profile Photo"
    })
})
/**
 * Edit profile
 */
router.post('/edit/profile', (req, res)=>{

    console.log(req.body);
    var fName = req.body.fName;
    var lName = req.body.lName;
    var email = req.body.email;
    var username = req.body.username;
    var phone = req.body.phoneNumber;

    var sql = `UPDATE customers SET firstname=?,lastname=?,username=?,phonenumber=? WHERE email=?;`;
    var values = [fName, lName, username, phone, email];
    db.query(sql, values, (err, result)=>{
        if(err){
            console.log(err);
            req.flash('danger', "Could not update!");
        }
        console.log(result);
        req.flash('success', "Profile updated successfully!");
    })
})
router.post('/delete/profile/:id', (req,  res)=>{

    var id = req.params.id;
    var sql = `DELETE FROM customers WHERE custoemrID=?;`;
    db.query(sql,id, (err, result)=>{
        if(err){
            console.log(err);
            req.flash('danger', "Profile not Deleted!");
        }
        console.log(result);
        req.flash("success", 'Profile deleted succesfully!');
    })
})

/**
 * Parcel delivery, bus seat booking
 */
router.post("/bus/booking", (req, res)=>{

    console.log(req.body);
    var customerID = req.body.customerID;
    var from = req.body.from;
    var to = req.body.to;
    var date  = req.body.date;
    var ticketNumber;
    var status = 'pending';

    (function(){
        var length = 5,
            charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        ticketNumber = retVal;
        return retVal;
    })();

    var traveller = new Travellers({
        from: from,
        to: to,
        arrival: date,
        ticketNumber: ticketNumber,
        status: status,
        customerID: customerID,
    })
    traveller.save((err)=>{
        if (err) {
            console.log(err);
        } else {
            req.flash('success', 'Successfully booked!');
            res.redirect('/account')
        }
    })
})
router.post('/parcel/delivery', (req, res)=>{

    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files)=>{
        console.log(files, fields);

        var customerID = fields.customerID;
        var name = fields.name;
        var from = fields.from;
        var to = fields.to;
        var pic = files.pic.originalFilename;
        var receiptId;
        (function(){
            var length = 8,
                charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                retVal = "";
            for (var i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
            }
            receiptId = retVal;
            return retVal;
        })();

        if(!Array.isArray(files.pic)){
            console.log(files);
            let oldPath = files.pic.filepath;
            let newPath = path.join( 'public/users/', files.pic.originalFilename);

            fs.rename(oldPath, newPath, err => {
                if(err) throw err;
                var deliver = new Parcels({
                    customerId: customerID,
                    receiptId: receiptId,
                    iName: name,
                    routeFrom: from,
                    routeTo: to,
                    photo: pic
                })
                deliver.save((err)=>{
                    if(err) throw err;
                    console.log('New parcel!');
                    req.flash('success', 'Parcel ready for delivery!')
                    res.redirect('/account')
                })
            })
        }else{
            console.log("Can't upload multiple files!");
            res.redirect('/account');
        }
    })
})


/**
 * Payments
 */
router.post('/mpesa/pay', (req, res)=>{
    console.log(req.body);
    var amt = req.body.amount;
    var phone = req.body.phone.substring(1);


    //credentials
    const credentials = {
        clientKey: 'B2Lpxtckr6vjLmaaGJJFdAeJCegscOEs',
        clientSecret: 'VZZeO9adGjHCdmmJ',
        initiatorPassword: 'Safaricom426!',
        securityCredential: 'testapi',
        certificatePath: null
    };

    //environment either "production" or "sandbox"
    const environment = "sandbox";

    // create a new instance of the api
    const mpesa = new Mpesa(credentials, environment);

    //Lipa na Mpesa online
    mpesa
    .lipaNaMpesaOnline({
        BusinessShortCode: 174379,
        Amount:  Number.parseInt(amt),/* 1000 is an example amount */
        PartyA: '254'+phone,
        PartyB: 174379,
        PhoneNumber: '254'+phone,
        CallBackURL: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        AccountReference: "VictechMedia",
        passKey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
        TransactionType: "CustomerBuyGoodsOnline" /* OPTIONAL */,
        TransactionDesc: "Transaction Description" /* OPTIONAL */,
    })
    .then((response) => {
        //Do something with the response
        //eg
        console.log(response);
    })
    .catch((error) => {
        //Do something with the error;
        //eg
        console.error(error);
    });
})



/*
 * GET login
 */
router.get('/login', function (req, res) {

    if (res.locals.user) res.redirect('/account');
    
    res.render('main_pages/login', {
        title: 'Log in'
    });

});

/*
 * POST login
 */
router.post('/login', function (req, res, next) {

    passport.authenticate('local', {
        successRedirect: '/account',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
    
});

/*
 * GET logout
 */
router.get('/logout', function (req, res) {

    req.logout();
    
    req.flash('success', 'You are logged out!');
    res.redirect('/users/login');

});

// Exports
module.exports = router;