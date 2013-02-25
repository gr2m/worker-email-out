var request = require("request");
var cradle = require("cradle");
var url = require("url");

var EmailWorker = require("./lib/email-out.js");

var config = {
  server: process.env["HOODIE_SERVER"],
  email: {
    service: process.env["HOODIE_EMAIL_SERVICE"],
    host: process.env["HOODIE_EMAIL_HOST"],
    auth: {
      user: process.env["HOODIE_EMAIL_USER"],
      pass: process.env["HOODIE_EMAIL_PASS"]
    }
  }
};

var uri = url.parse(config.server);
console.log(uri);
config.couch = new(cradle.Connection)(uri);
config.name = "email-out";
// console.log(config.couch);
var workers = [];
config.couch.databases(function(error, dbs) {
  console.log(error);
  console.log(dbs);

  dbs.forEach(function(db) {
    if(db.substr(-7) == "$public") { return; }
    if(db[0] == "_") { return; }
    if(db == "modules") { return; }
    config.db = db;
    var worker = new EmailWorker(config);
    workers.push(worker);
  });
});
