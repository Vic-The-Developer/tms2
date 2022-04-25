var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/database');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
// const MongoDBStore = require('connect-mongodb-session')(session);
var passport = require('passport');
var MongoStore = require('connect-mongo');
var cors = require('cors');
const corsOptions = {
    origin: ["http://localhost:8081"],
    credentials: true, 
    optionsSuccessStatus: 200,
    methods: "GET, PUT, DELETE, PATCH, POST"
}

// Connect to db
mongoose.connect(config.database);
// mongoose.connect(process.env.DB, {
//     useNewURLParser: true,
//     useCreateIndex: true,
// }).then(()=>{
//     console.log('Connected successfully to the database')
// }).catch(err=>console.log(err));
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Connected to MongoDB');
});

// Init app
var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/users/')));

// Set global errors variable
app.locals.errors = null;

// Body Parser middleware
// 
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));
// parse application/json
app.use(bodyParser.json());

app.use(cors(corsOptions));

// Express Session middleware
app.set('trust proxy', 1);
// app.use(session({
//     store: MongoStore.creates({mongoUrl: 'mongodb://Admin:VictorMwendwa@victech-media-shard-00-00.lhlgr.mongodb.net:27017,victech-media-shard-00-01.lhlgr.mongodb.net:27017,victech-media-shard-00-02.lhlgr.mongodb.net:27017/mySessions?ssl=true&replicaSet=atlas-ksor6c-shard-0&authSource=admin&retryWrites=true&w=majority'}),
//     secret: 'keyboard cat',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: true }
// }));
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
//  cookie: { secure: true }
}));

// Express Validator middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
                , root = namespace.shift()
                , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    },
    customValidators: {
        isImage: function (value, filename) {
            var extension = (path.extname(filename)).toLowerCase();
            switch (extension) {
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }
}));

// Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req,res,next) {
   res.locals.cart = req.session.cart;
   res.locals.user = req.user || null;
   next();
});

// Set routes 
var pages = require('./routes/pages.js');
var users = require('./routes/users.js');
var adminPages = require('./routes/admin_pages.js');

app.use('/admin/pages', adminPages);
app.use('/users', users);
app.use('/', pages);

// Start the server
var port = 8081;
app.listen(port, function () {
    console.log('Server started on port ' + port);
});