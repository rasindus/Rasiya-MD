const fs = require("fs");
if (fs.existsSync("config.env"))
  require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}
module.exports = {
  SESSION_ID: process.env.SESSION_ID || "6xIS0Qpb#PC_V8Znj4l0q0X966dsxVUejOVnkGwDIFlDxdQmSNeA",
  MONGODB: process.env.MONGODB || "mongodb://mongo:hQXDbDemiqTxqhsyOZImHnEfhdNVJVZk@turntable.proxy.rlwy.net:32949",
  OWNER_NUM: process.env.OWNER_NUM || "94783364887",
};
