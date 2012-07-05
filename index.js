var request = require("request");

var config = {
  server: process.env["HOODIE_SERVER"],
  admin: {
    user: process.env["HOODIE_ADMIN_USER"],
    pass: process.env["HOODIE_ADMIN_PASS"]
  },
  email: {
    service: process.env["HOODIE_EMAIL_SERVICE"],
    host: process.env["HOODIE_EMAIL_HOST"],
    auth: {
      user: process.env["HOODIE_EMAIL_USER"],
      pass: process.env["HOODIE_EMAIL_PASS"]
    }
  }
};

var workers = [];
request({
  uri: config.server + "/_all_dbs"
}, function(error, response, body) {
  if(error !== null) {
    console.warn("init error, _all_dbs: " + error);
  }

  var dbs = JSON.parse(body);
  dbs.forEach(function(db) {
    var worker = new EmailWorker(config, db);
    workers.push(worker);
  });
});
