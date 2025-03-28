const fs = require("fs");
if (fs.existsSync("config.env"))
  require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}
module.exports = {
  SESSION_ID: process.env.SESSION_ID || "e4RGDQiI#7dKhCJ4UPX9zYjv5bQpdyUV23V4dd_bhMQRBAGsDxHw",
  MONGODB: process.env.MONGODB || "mongodb://mongo:hQXDbDemiqTxqhsyOZImHnEfhdNVJVZk@turntable.proxy.rlwy.net:32949",
  OWNER_NUM: process.env.OWNER_NUM || "94783364887",
};
