//jshint esversion:6

//Variables
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const md5 = require('md5');

const app = express();

console.log(process.env.SECRET);

const port = 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true, 
    useUnifiedTopology:true
});

//Setting User Database
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:  ["password"] }); // !!!it should be added before you create Mongoose.model


const User = new mongoose.model("User", userSchema);

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

// POST connections
app.post("/register", function(req, res) {

    const newUser = new User({
        email:  req.body.username,
        password: md5(req.body.password)
    });

    newUser.save(function(err) {
        if(err) {
            console.log(err);
        }else {
            res.render("secrets"); //once registered successfully - "Jack Bauer is my hero" - pops up
        }
    });
});

app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
                              
    User.findOne({email: username}, function(err, foundUser) {
        if(err) {
            console.log(err);
        } else {
            if(foundUser) {
                if(foundUser.password === password) {
                    res.render("secrets");
                }
            }
        }
    });
});

//Setting PORT
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});