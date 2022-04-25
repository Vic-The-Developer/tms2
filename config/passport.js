var LocalStrategy = require('passport-local').Strategy;
// var User = require('../models/user');
var bcrypt = require('bcrypt');
const mysql = require("mysql");
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '/victor.mwendwa.18/',
    database: 'tms'
})

module.exports = function (passport) {

    passport.use(new LocalStrategy(function (username, password, done) {
        var sql = `SELECT * FROM customers WHERE username=? ;`;
        var username = username;
        db.query(sql,username,(err, user)=>{
            if(err){ console.log(err)};

            if(!user){
                return done(null, false, {message: 'No user found!'});
            }

            bcrypt.compare(password, user[0].password, (err, isMatch)=>{
                if(err){console.log(err)};
                 
                if(isMatch){
                    return done(null, user);
                }else{
                    return done(null, false, {message: 'Wrong password!'});
                }
            })
        })


        // User.findOne({username: username}, function (err, user) {
        //     if (err)
        //         console.log(err);

        //     if (!user) {
        //         return done(null, false, {message: 'No user found!'});
        //     }

        //     bcrypt.compare(password, user.password, function (err, isMatch) {
        //         if (err)
        //             console.log(err);

        //         if (isMatch) {
        //             return done(null, user);
        //         } else {
        //             return done(null, false, {message: 'Wrong password.'});
        //         }
        //     });
        // });

    }));

    passport.serializeUser(function (user, done) {
        done(null, user[0].customerID);
    });

    passport.deserializeUser(function (id, done) {
        var sql = `SELECT * FROM customers WHERE customerID = ?;`;
        db.query(sql, id, (err, user)=>{
            done(err, user);
        })

        // User.findById(id, function (err, user) {
        //     done(err, user);
        // });
    });

}