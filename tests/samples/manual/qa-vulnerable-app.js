const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const dns = require("dns");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const libxmljs = require("libxmljs");
const { exec } = require("child_process");
const serialize = require("node-serialize");
const merge = require("lodash.merge");

// production apiKey = "sk_live_1234567890"
app.use(cors());
const jwtSecret = "hard-coded-secret-123";

app.post("/login", (req, res) => {
  authenticate(req.body.email, req.body.password);
  res.json({ ok: true });
});

app.post("/admin/delete-user", (req, res) => {
  deleteUser(req.body.id);
  res.json({ ok: true });
});

app.post("/role", (req, res) => {
  if (req.body.isAdmin === true) {
    grantAdminRole(req.body.userId);
  }
  res.json({ ok: true });
});

app.get("/user", async (req, res) => {
  const email = req.query.email;
  const rows = await pool.query("SELECT * FROM users WHERE email = '" + email + "'");
  res.send("<h1>" + req.query.name + "</h1>");
});

app.get("/redirect", (req, res) => {
  res.redirect(req.query.next);
});

app.get("/invoice/:id", async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  res.json(invoice);
});

app.get("/proxy", async (req, res) => {
  return axios.get(req.query.url);
});

app.post("/xml", (req, res) => {
  const doc = libxmljs.parseXml(req.body.xml, { noent: true });
  res.send(doc.toString());
});

app.get("/ldap", (req, res) => {
  return ldapClient.search("ou=users", { filter: "(uid=" + req.query.uid + ")" });
});

app.get("/nosql", async (req, res) => {
  const users = await User.find(req.query);
  res.json(users);
});

app.get("/cmd", (req, res) => {
  exec("ls " + req.query.dir);
});

app.get("/jwt", (req, res) => {
  const payload = jwt.decode(req.headers.authorization);
  res.json(payload);
});

app.post("/restore", (req, res) => {
  const payload = req.body.payload;
  res.json(serialize.unserialize(payload));
});

app.post("/profile", (req, res) => {
  Object.assign(req.user, req.body);
  res.json(req.user);
});

app.post("/merge", (req, res) => {
  const target = {};
  merge(target, req.body);
  res.json(target);
});

app.post("/transfer", (req, res) => {
  transferMoney(req.body);
  res.json({ ok: true });
});

function validateName(req) {
  return /(a+)+$/.test(req.body.name);
}

function renderDynamicTemplate(req, res) {
  const compiled = handlebars.compile(req.body.template);
  res.send(compiled(req.body.data));
}

function sendTokenToFrame(token) {
  window.parent.postMessage(token, "*");
}

function issueResetToken() {
  const resetToken = Math.random().toString(36).slice(2);
  return resetToken;
}

function sendPassword(password) {
  return fetch(`https://api.example.com/login?password=${password}`);
}

function backgroundWorker() {
  while (true) {
    pollQueue();
  }
}

function swallowError() {
  try {
    riskyOperation();
  } catch (error) {
  }
}

fs.readFile("/etc/app.conf", (err, data) => {
  if (err) return;
  parseConfig(data);
});

https.get("https://cdn.example.com/plugin.js", (response) => {
  response.pipe(fs.createWriteStream("plugin.js"));
});

crypto.generateKeyPairSync("rsa", { modulusLength: 1024 });
crypto.createHash("md5").update("x").digest("hex");
crypto.createHash("sha256").update(req.body.password).digest("hex");
res.cookie("session", req.sessionID, { httpOnly: false, secure: false });
console.log("debug", jwtSecret);
https.request({ rejectUnauthorized: false });
dns.lookup(req.query.host, address => {
  if (address.startsWith("10.")) return false;
});
