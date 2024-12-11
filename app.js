if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
//method override
const methodOverride = require("method-override");

// require wrapAsync
const wrapAsync = require("./utils/wrapAsync.js");

// require expressError
const ExpressError = require("./utils/ExpressError.js");

// require sessions
const sessions = require("express-session");
const MongoStore = require("connect-mongo");
// require flash
const flash = require("connect-flash");

//require ejs mate
const ejsMate = require("ejs-mate");

//require Listing model
const Listing = require("./models/listing.js");

// require Review model
const Review = require("./models/reviews.js");

// require Joi Schema
const { listingSchema } = require("./schema.js");
const { reviewSchema } = require("./schema.js");

// requiring routes
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// require passport
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

//setup ejs
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
//parse
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
// to use ejsMate
app.engine("ejs", ejsMate);
// using static files (css and other styles)
app.use(express.static(path.join(__dirname, "/public")));

const dbUrl = process.env.ATLASDB_URL;

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

// creating session options
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

//root route
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// using sessions
app.use(sessions(sessionOptions));
// using flash
app.use(flash());

// configuring strategy
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
// serialize and deserialize user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// defining locals
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

async function main() {
  await mongoose.connect(dbUrl);
}
main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

// using listings and review route object
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// server starting
app.listen(8080, () => {
  console.log("server started at 8080");
});

// page not found route
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not found!"));
});

// handling server-side errors
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});
