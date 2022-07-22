var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;
var isUser = auth.isUser;
var formidable = require('formidable');
var fs = require('fs-extra');
var path = require('path');
const mysql = require("mysql");
var Parcels = require('../models/parcels');
var Travellers = require("../models/travellers");
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tms'
})


/*
 * GET pages index
 */
router.get('/', function (req, res) {
    var parcels = [];
    var drivers = [];
    var complete = [];
    var revenueMonth = [];
    var revenueAmount = [];
    var carHire = [];
    var travellers = [];
    var customers = [];
    var monthExpM = [];
    var monthExpA = [];
    var tripMth = [];
    var tripAmt = [];
    var vehicles = [];

    Parcels.find({},(err, result)=>{
        if(err) throw err;
        console.log('Parcels', result);
        result.forEach((data)=>{
            parcels.push(data);
        })

        Travellers.find({}, (err,result)=>{
            if(err) throw err;
            console.log('Travellers', result);
            result.forEach((data)=>{
                travellers.push(data);
            })
            var checked,unchecked;
            travellers.forEach((data)=>{
                var check = [];
                var uncheck = [];
                if(data.status==='checked'){
                    check.push(data)
                }
                if(data.status==='pending'){
                    uncheck.push(data)
                }
                unchecked = uncheck.length;
                checked = check.length;
            })
            var sql1 = `SELECT * FROM drivers;`;
            db.query(sql1, (err, result)=>{
                if(err) throw err;
                console.log('Drivers result:',result);
                result.forEach((data)=>{
                    drivers.push(data)
                })

                    var sql2 = `SELECT * FROM monthExp;`;
                    db.query(sql2, (err,result)=>{
                        if(err) throw err;
                        console.log("Month Exp: ",result);
                        result.forEach((data)=>{
                            monthExpM.push(data.month);
                            monthExpA.push(data.taxes+data.insurance+data.vehicle);
                        })
            

                        var sql3 = `SELECT * FROM tripExp;`;
                        db.query(sql3,(err,result)=>{
                            if(err) throw err;
                            console.log("Trip Exp: ",result);
                            result.forEach((data)=>{
                                tripMth.push(data.month);
                                tripAmt.push(data.fuel+data.maintainance+data.misc+data.tolls)
                            })


                            var sql4 = `SELECT * FROM carhire;`;
                            db.query(sql4, (err, result)=>{
                                if(err) throw err;
                                console.log('Car hire: ',result);
                                result.forEach((data)=>{
                                    carHire.push(data)
                                })
                                

                                var sql5 = `SELECT * FROM customers;`;
                                db.query(sql5, (err, result)=>{
                                    if(err) throw err;
                                    console.log('Customer: ',result);
                                    result.forEach((data)=>{
                                        customers.push(data);
                                    })

                                    var sql6 = `SELECT * FROM revenue;`;
                                    db.query(sql6, (err, result)=>{
                                        if(err) throw err;
                                        console.log('Revenue', result);
                                        result.forEach((data)=>{
                                            revenueMonth.push(data.month);
                                            revenueAmount.push(data.amount)
                                        })
                                        console.log('amount', revenueAmount)
                                        console.log('Month', revenueMonth)

                                        parcels.forEach((data)=>{
                                            if(data.status===null || data.status===undefined){
                                                complete.push(0)
                                            }else{
                                                console.log('complete',data)
                                                var cmp = [];
                                                cmp.push(data);
                                                var comp = cmp.length;
                                                var total = parcels.length;
                                                var comp2 = (comp*100)/total;
                                                complete.push(comp2);
                                            }
                                        })

                                        var sql7 = `SELECT * FROM vehicles;`;
                                        db.query(sql7,(err, result)=>{
                                            if(err) throw err;
                                            console.log(result);
                                            var bus1, truck1;
                                            result.forEach((data)=>{
                                                vehicles.push(data);
                                            })
                                            var truck = [];
                                            var bus = [];
                                            vehicles.forEach((data)=>{
                                                if(data.type==='truck'){
                                                    truck.push(data);
                                                    truck1 = truck.length;
                                                }
                                                if(data.type==='bus'){
                                                    bus.push(data);
                                                    bus1 = bus.length
                                                }
                                            })
                                            
                                            var sql8 = `SELECT * FROM routes;`;
                                            var routes = [];
                                            db.query(sql8, (err,result)=>{
                                                if(err) throw err;
                                                var resu = result;
                                                result.forEach((data)=>{
                                                    routes.push(data);
                                                })
                                                console.log('Routes:',routes);

                                                if(res.locals.user===null){
                                                    res.render('main_pages/about',{
                                                        title: 'About Us'
                                                    });
                                                        
                                                } else{
                                                    res.render('admin_pages/dashboard', {
                                                        title: "Dashboard",
                                                        complete: complete,
                                                        parcels: parcels,
                                                        monthExpA: monthExpA,
                                                        tripAmt: tripAmt,
                                                        tripMth: tripMth,
                                                        drivers: drivers,
                                                        revenueMonth: revenueMonth,
                                                        revenueAmount: revenueAmount,
                                                        carHire: carHire,
                                                        travellers: travellers,
                                                        customers: customers,
                                                        vehicles: vehicles,
                                                        bus: bus1,
                                                        truck: truck1,
                                                        checked: checked,
                                                        unchecked: unchecked,
                                                        routes: routes,
                                                        resu: resu
                                                    });
                                                }

                                                
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
            })
        })
    })
});

router.post('/monthly', (req, res)=>{

    console.log(req.body);
    var date = req.body.month;
    var taxes = req.body.taxes;
    var insurance = req.body.insurance;
    var vehicle = req.body.vehicle;
    var month;

    var mths = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July','Aug','Sept','Oct', 'Nov', 'Dec'];
    month = mths[date.substr(6,1)-1];

    var sql = `INSERT INTO monthExp(date,taxes,insurance,vehicle,month) VALUES(?);`;
    var values = [date,taxes,insurance,vehicle,month];

    db.query(sql,[values], (err,result)=>{
        if(err) throw err;
        console.log(result);
        res.redirect('/admin/pages/')
    })
})

router.post('/trip', (req,res)=>{

    console.log(req.body);
    var date =req.body.month;
    var fuel = req.body.fuel;
    var maintainance = req.body.maintainance;
    var misc = req.body.misc;
    var tolls = req.body.tolls;
    var month;

    var mths = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July','Aug','Sept','Oct', 'Nov', 'Dec'];
    month = mths[date.substr(6,1)-1];

    var sql = `INSERT INTO tripexp(month,fuel,maintainance,misc,tolls) VALUES(?);`;
    var values = [month, fuel, maintainance, misc, tolls];

    db.query(sql,[values], (err,result)=>{
        if(err){
            console.log(err);
            req.flash('danger', 'Could not insert!')
        };
        console.log(result);
        req.flash('success', 'Record entered successfully!');
        res.redirect('/admin/pages/')
    })
})

router.post('/add/jobs', (req,res)=>{

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
                    res.redirect('/admin/pages')
                })
            })
        }else{
            console.log("Can't upload multiple files!");
            res.redirect('/admin/pages');
        }
    })
})
//Delete job
router.get('/delete/job/:id', function (req, res) {
    var receipt = req.params.id;
    console.log(receipt);
    Parcels.deleteOne({receipt: receipt}, (err,result)=>{
        if(err) throw err;
        console.log(result);
        req.flash('success', 'Record Deleted!');
        res.redirect('/admin/pages');
    })
});


//update status
router.post('/job/status', (req,res)=>{

    console.log(req.body);
    var status = req.body.status;
    var receipt = req.body.receipt;

    Parcels.updateOne({receiptId: receipt}, {$set: {status: status}}, (err, result)=>{
        if(err){
            console.log(err);
            req.flash('danger', 'Could not update status!');
            res.redirect('/admin/pages/')
        }else{
            console.log(result);
            req.flash('success', 'Status changed successfully!');
            res.redirect('/admin/pages');
        }
    })
})



/*
 * DRIVERS
 */
router.post('/add/driver', function (req, res) {

    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files)=>{
        console.log(fields,files);

        var fName = fields.fName;
        var lName = fields.lName;
        var username = fields.username;
        var dob = fields.dob;
        var pic = files.pic.originalFilename;
        var plate = fields.plate;
        var status = fields.status;

        var sql = `INSERT INTO drivers(plate,username,firstname,lastname,DOB,status,photo) VALUES(?);`;
        var values = [plate,fName,lName,username,dob,status,pic];
        
        db.query(sql,values, (err, result)=>{
            if(err) throw err;
            console.log(result);
            res.redirect('/admin/pages');
        })
    });

});
router.post('/edit/drivers', (req,res)=>{

    console.log(req.body);
    var id = req.body.driverID;
    var username = req.body.username;
    var fName = req.body.fName;
    var lName = req.body.lName;
    var plate = req.body.plate;

    var sql = `UPDATE drivers SET plate=?, username=?, firstname=?, lastname=? WHERE driverID=?;`;
    db.query(sql,values,(err, result)=>{
        if(err){
            console.log(err);
            res.flash('error', "Did not update record!");
            res.redirect('/admin/pages');
        };
        console.log(result);
        res.flash('success', 'Record is updated!');
        res.redirect('/admin/pages');
    })
})
router.get('/delete/driver/:id', (req, res)=>{

    var driverID = req.params.id;

    var sql = `DELETE FROM drivers WHERE driverID=?;`;
    db.query(sql,driverID, (err, result)=>{
        if(err) throw err;
        console.log(result);
        res.redirect('/admin/pages');
    })
})
/*
 *customers 
 */
router.post('/edit/customer', (req,res)=>{

    console.log(req.body);
    var fName = req.body.fName;
    var lName = req.body.lName;
    var username = req.body.username;
    var phoneNumber = req.body.phoneNumber;
    var email = req.body.email;

    var sql = `UPDATE customers SET fName=?, lName=?, userName=?, phoneNumber=? WHERE email=?;`;
    var values = [fName, lName, username, phoneNumber, email];
    db.query(sql, values, (err, result)=>{
        if(err){
            console.log(err);
            res.flash('error', "Did not update record!")
        };
        console.log(result);
        res.flash('success', 'Record is updated!');
        res.redirect('/admin/pages');
    })
})
router.get("/delete/customer/:id", (req, res)=>{

    var id = req.params.id;
    var sql = `DELETE FROM customers WHERE customerID=?;`;
    db.query(sql,id, (err, result)=>{
        if(err) throw err;
        console.log(result);
        res.redirect('/admin/pages')
    })
})

/**
 * TRAVELLERS
 */
router.get('/check/traveller/:id', (req, res)=>{

    var id = req.params.id;
    Travellers.findOneAndUpdate({ticketNumber: id}, {$set:{status:"checked"}}, (err,result)=>{
        if(err) throw err;
        console.log(result);
        res.redirect("/admin/pages");
    })
})
router.get('/delete/traveller/:id', (req, res)=>{

    var id = req.params.id;
    Travellers.deleteOne({ticketNumber: id}, (err, result)=>{
        if(err) throw err;
        console.log(result);
        
        res.redirect('/admin/pages');
    })
})
/**
 * Vehicles
 */
router.post('/add/vehicle', (req,res)=>{

    console.log(req.body);
    var make = req.body.make;
    var type = req.body.type;
    var plate = req.body.plate;
    var route = req.body.route;
    var status = req.body.status;

    var sql = `INSERT INTO vehicles(make,type,numberplate,status,route) VALUES(?);`;
    var values = [make,type,plate,status,route];
    db.query(sql,values, (err, result)=>{
        if(err) throw err;
        console.log(result);
        
        res.redirect('/admin/pages');
    })
})
router.post('/edit/vehicle', (req, res)=>{

    console.log(req.body);
    var plate = req.body.plate;
    var status = req.body.status;

    var sql = `UPDATE vehicles SET status=? WHERE plate=?;`;
    var values = [status,plate];
    db.query(sql,values, (err, result)=>{
        if(err){
            console.log(err);
            req.flash('danger','Could not update!')
            res.redirect('/dashboard');
        }
        console.log(result);
        req.flash('success', 'Record updated sucessfully!');
        res.redirect('/admin/pages')
    })
})
router.get('/delete/vehicle/:id', (req, res)=>{

    var id = req.params.id;
    var sql = `DELETE FROM vehicles WHERE vehicleID=?;`;
    db.query(sql, id, (err, result)=>{
        if(err){
            console.log(err);
            req.flash('danger', 'Record nor deleted!');
            res.redirect('/admin/pages');
        }
        console.log(result);
        req.flash('sucess', 'Record deleted sucessfully!');
        res.redirect('/admin/pages')
    })
})
/**
 * Car Hire
 */
router.post('/add/hire', (req, res)=>{

    console.log(req.body);
    var id = req.body.customerID;
    var make = req.body.make;
    var type = req.body.type;
    var due = req.body.due;
    var plate  =req.body.plate;
    var receipt;

    (function(){
        var length = 18,
            charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        receipt = retVal;
        return retVal;
    })();

    var sql = `INSERT INTO carhire(customerID,make,type,due,plate,receipt) VALUES(?);`;
    var values = [id,make,type,due,plate,receipt];
    db.query(sql, values, (err, result)=>{
        if(err){
            console.log(err);
            req.flash('danger', 'Could not enter record!');
        }
        console.log(result);
        req.flash('success', 'Record entered sucessfully!');
        res.redirect('/admin/pages')
    })
})
router.get('/hire/check/:id', (req, res)=>{

    var id = req.params.id;
    var sql = `UPDATE carhire SET check=? WHERE plate=?;`;
    var values = ['checked',id];
    db.query(sql, values, (err, result)=>{
        if(err){
            console.log(err);
            req.flash('danger', 'Could not check!');
            res.redirect('/admin/pages')
        }
        console.log(result);
        req.flash('success', 'Checked successfully!');
        res.redirect('/admin/pages');
    })
})
router.get('/hire/delete/:id', (req, res)=>{

    var id = req.params.id;
    var sql = `DELETE FROM carhire WHERE plate=?;`;
    db.query(sql, id, (err, result)=>{
        if(err){
            console.log(err);
            req.flash('danger', "Could not delete record!");
            res.redirect('/admin/pages')
        }
        console.log(result);
        req.flash('success', 'Record deleted successfully!');
        res.redirect('/admin/pages');
    })
})
/**
 * Routes
 */
router.post('/add/route', (req, res)=>{

    console.log(req.body);
    var from = req.body.from;
    var to = req.body.to;

    var sql = `INSERT INTO routes(routeFrom, routeTo) VALUES(?);`;
    var values = [from, to];
    db.query(sql, [values], (err, result)=>{
        if(err){
            console.log(err);
            req.flash('danger', 'Record not inserted!');
            res.redirect('/admin/pages');
        }
        console.log(result);
        req.flash('success','Record inserted successfully!');
        res.redirect('/admin/pages');
    })

})
router.get('/delete/route/:id', (req, res)=>{

    var id = req.params.id;
    var sql = `DELETE FROM routes WHERE id=?;`;
    db.query(sql,id, (err,result)=>{
        if(err){
            console.log(err);
            req.flash('danger','Could not remove!');
            res.redirect('/admin/pages')
        }
        console.log(result);
        req.flash('success', "Record removed successfully!");
        res.redirect('/admin/pages')
    })
})


// Exports
module.exports = router;
