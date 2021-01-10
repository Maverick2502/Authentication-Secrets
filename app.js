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
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const port = 3000;

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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:  ["password"] }); // !!!it should be added before you create Mongoose.model
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //creates local Login strategy
 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// OAuth configuration
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, done) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
      });
  }
));

//GET connections
app.get("/", function(req, res) {
    res.render("home");
});

//Good way 
app.get("/auth/google",
  passport.authenticate('google',{ 
      scope: ["profile"] 
}));

//Better way 
// app.route("/auth/google")
//     .get(passport.authenticate('google', {
//         scope: ["profile"]
//     }));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/secrets");
  });

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res) {
    User.find({"secret": {$ne: null}}, function(err, foundUsers) {
        if(err) {
            console.log(err);
        } else {
            if(foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    });
});

app.get("/submit", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

app.post("/submit", function(req, res) {
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser) {
        if(err) {
            console.log(err);
        } else {
            if(foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function() {
                    res.redirect("/secrets");
                });
            }
        }
    });
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