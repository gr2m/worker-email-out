var request = require("request");
var cradle = require("cradle");
var url = require("url");

var EmailWorker = require("./lib/email-out.js");

var config = {
  url: process.env["HOODIE_SERVER"],
  email: {
    service: process.env["HOODIE_EMAIL_SERVICE"],
    host: process.env["HOODIE_EMAIL_HOST"],
    auth: {
      user: process.env["HOODIE_EMAIL_USER"],
      pass: process.env["HOODIE_EMAIL_PASS"]
    }
  }
};

var uri = url.parse(config.url);
config.couch = new(cradle.Connection)(uri);

var workers = [];
request({
  uri: config.url + "/_all_dbs"
}, function(error, response, body) {
  if(error !== null) {
    console.warn("init error, _all_dbs: " + error);
  }

  var dbs = JSON.parse(body);
  dbs.forEach(function(db) {
    if(!db.match(/\$/)) { return; }
    if(db.substr(-7) == "$public") { return; }
    var worker = new EmailWorker(config, db);
    workers.push(worker);
  });
});
