var request = require("request");

var config = {
  server: process.env["CANG_SERVER"],
  admin: {
    user: process.env["CANG_ADMIN_USER"],
    pass: process.env["CANG_ADMIN_PASS"]
  },
  email: {
    service: process.env["CANG_EMAIL_SERVICE"],
    host: process.env["CANG_EMAIL_HOST"],
    auth: {
      user: process.env["CANG_EMAIL_USER"],
      pass: process.env["CANG_EMAIL_PASS"]
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
