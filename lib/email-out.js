var util = require("util");
var nodemailer = require("nodemailer");
var request = require("request");
var url = require("url");
var HoodieWorker  = require('hoodie-worker');

module.exports = EmailWorker;

function EmailWorker(config) {
  this._config = config;
  this.setup(config).then( this.launch.bind(this) )
}
util.inherits(EmailWorker, HoodieWorker);

EmailWorker.prototype.launch = function() {
  var that = this;
  this.couch.databases(function(error, dbs) {
    if(error) {
      console.log(error);
      throw error;
    }
    dbs.forEach(function(dbName) {
      if(dbName.substr(-7) == "$public") { return; }
      if(dbName[0] == "_") { return; }
      if(dbName == "modules") { return; }
      EmailWorker.prototype.db.bind(that, dbName)();
    });
  });
};

EmailWorker.prototype.db = function(db) {
  // your worker magic starts hier!
  // console.warn("EmailWorker running on db: " + db);
  // console.warn("With config: %j", config)


  console.log("[email-out] Starting EmailOut Worker for " + db);
  this.userdb = this.couch.database(db);
  var feed = this.userdb.changes({include_docs: true});

  feed.on("change", EmailWorker.prototype._change_cb.bind(this));
  feed.on("error", function(error) {
    console.warn("[email-out] email change_cb caught error: %j", error);
    // todo report error
    return;
  });
  console.log("[email-out] Started EmailOut Worker for " + db);
};

EmailWorker.prototype._change_cb = function(change) {
  console.log("change");
  var doc = change.doc;

  if(!doc) {
    console.warn("[email-out] no doc error wakka wakka");
    return;
  }


  if(doc.type && doc.type !== "$email") {
    console.warn("[email-out] not an email doc, ignoring. fix server filter!");
    return;
  }

  if(!doc.to) {
    console.warn("[email-out] empty or no 'to' field, ignoring.");
    // set error actually
    return;
  }

  if(!doc.to.match(/@/)) {
    console.warn("[email-out] invalid 'to' field, ignoring.");
    // set error actually
    return;
  }

  if(doc.error || doc.delivered_at) {
    console.warn("[email-out] we did try sending this once, ignoring.");
    return;
  }

  // console.warn("change: %j", change);

  // send!
  this._doSend(doc, {
    success: (function() {
      // yay
      delete doc.transport;
      doc.delivered_at = new Date().toJSON();
      this.userdb.save(doc._id, doc._rev, doc);
    }).bind(this),
    error: (function(error) {
      // nooooo
      // yay
      delete doc.transport;
      doc.error = error;
      this.userdb.save(doc._id, doc._rev, doc);
    }).bind(this)
  });
};

EmailWorker.prototype._doSend = function(email, callbacks) {
  console.log("[email-out] sending");
  // send email
  // create reusable transport method (opens pool of SMTP connections)
  var transport_config = {
    host: this._config.email.host,
    port: 465,
    auth: {
      user: this._config.email.auth.user,
      pass: this._config.email.auth.pass
    },
    secureConnection: true,
    service: this._config.email.service
  };
  var smtpTransport = nodemailer.createTransport("SMTP", transport_config);

  // send mail with defined transport object
  smtpTransport.sendMail(email, function(error, response){
    if(error) {
      if(callbacks.error) {
        console.log("[email-out] Mail not sent: " + error);
        callbacks.error(error);
      }
    } else {
      if(callbacks.success) {
        callbacks.success(response);
      }
    }
    smtpTransport.close(); // shut down the connection pool, no more messages
    console.log("[email-out] sent");
  });
}
