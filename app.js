//jshint esversion:6
//Variables
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');//1 Order is !important
const passport = require('passport');//2
const passportLocalMongoose = require('passport-local-mongoose');//3
const { Passport } = require('passport');


const app = express();
const port = 3000;
console.log(process.env.SECRET);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "Snyder's Cut is to be shown on HBO MAX",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session()); //manages our session

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true, 
    useUnifiedTopology:true
});

mongoose.set("useCreateIndex", true); // solves deprecation problem: collection.ensureIndex
//Setting User Database
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:  ["password"] }); // !!!it should be added before you create Mongoose.model
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //creates local Login strategy
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//GET connections
app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});
// POST connections
app.post("/register", function(req, res) {

    User.register({username: req.body.username}, 
        req.body.password, function(err, user) {
            if(err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
    }); 
    
});

app.post("/login", function(req, res) {
   
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });
    
});

//Setting PORT
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});