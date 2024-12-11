const mongoose = require("mongoose");

//requiring data and model
const initData = require("./data.js");
const Listing = require("../models/listing.js");

//db connection
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  await mongoose.connect(MONGO_URL);
}
main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

const initDB = async () => {
  //first deleting all data
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "67528cce4f484bb0ae53bdb6",
  }));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

initDB();
