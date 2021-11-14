const express = require("express");
const db = require("./database");
const bcrypt = require("bcrypt");
const app = express();
var validator = require("email-validator");

const session = require("express-session");
var FileStore = require("session-file-store")(session);
const cookieParser = require("cookie-parser");
const { urlencoded } = require("body-parser");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    resave: false,
    secret: "thisisdemoproject",
    cookie: {
      maxAge: 3000000000000000000000,
    },
    store: new FileStore({ logFn: function () {} }),
    saveUninitialized: false,
  })
);

app.get("/", (req, res) => {
  res.send("welcome");
});

const encryptPassword = async (req, res, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (err) {
    res.status(501).json({ msg: `${err}` });
  }
};

const decryptPassword = async (req, res, password, hashedPassword) => {
  try {
    const encodedPassword = await bcrypt.compare(password, hashedPassword);
    return encodedPassword;
  } catch (err) {
    res.status(501).json({ msg: `${err}` });
  }
};

const validEmail = (email) => {
  return validator.validate(email);
};

app.post("/register", async (req, res) => {
  var { username, password } = req.body;

  try {
    if (!validEmail(username))
      res.status(400).json({ msg: "enter email correctly" });
    let sql = `Select * from user where username="${username}"`;
    await db.con.query(sql, async (error, result) => {
      if (error) res.status(501).json({ msg: `${error}` });

      let obj = Object.assign({}, result);

      if (Object.keys(obj).length === 0) {
        password = await encryptPassword(req, res, password);
        var sql = `INSERT into user (username,password) values ("${username}","${password}")`;
        try {
          db.con.query(sql, (er, result) => {
            if (er) throw res.status(501).json({ msg: `${er}` });
            res.status(200).send("valid request");
          });
        } catch (err) {
          res.status(501).json({ msg: `${er}` });
        }
      } else {
        res.status(401).send("existing user");
      }
    });
  } catch (err) {
    res.status(500).json({ msg: `${err}` });
  }
});

app.post("/login", async (req, res) => {
  var { username, password } = req.body;
  try {
    if (req.session.authenticated) {
      res.status(200).json({ msg: "logged in successfully" });
    }
    let sql = `Select * from user where username="${username}"`;
    await db.con.query(sql, async (error, result) => {
      let obj = Object.assign({}, result);

      if (Object.keys(obj).length === 1) {
        let flag = await decryptPassword(req, res, password, obj[0].password);
        if (!flag) res.status(400).json({ msg: "password not match" });
        req.session.authenticated = true;
        req.session.username = username;
        res.status(200).json({ msg: "logged in successfully" });
      } else {
        res.status(400).json({ msg: "invalid user" });
      }
    });
  } catch (err) {
    res.status(500).json({ msg: `${err}` });
  }
});

app.post("/logout", (req, res) => {
  if (req.session.authenticated) {
    req.session.destroy();
    res.status(200).json({ msg: "logout" });
  } else {
    res.status(401).json({ msg: "not a loggedin user" });
  }
});

app.post("/addaddress", (req, res) => {
  if (req.session.authenticated) {
    var { address } = req.body;
    if (address === null || address === "")
      res.status(401).json({ msg: "address cannot be empty" });
    try {
      let sql = `Insert into address (username,address) values ("${req.session.username}","${address}")`;
      db.con.query(sql, (err, result) => {
        if (err) res.status(501).json({ msg: `${err}` });
        res.status(200).json({ msg: "added successfully" });
      });
    } catch (err) {
      res.status(501).json({ msg: `${err}` });
    }
  } else {
    res.status(401).json({ msg: "not a loggedin user" });
  }
});

// order place
app.post("/placeorder", (req, res) => {
  if (req.session.authenticated) {
    try {
      var { address } = req.body.address;
      if (address === null || address === "")
        res.status(401).json({ msg: "enter address cannot be empty" });
      for (var key in req.body.order) {
        {
          let sql = `INSERT INTO pendingorders (address,item,quantity,username) values("${address}","${key}","${req.body.order[key]}","${req.session.username}")`;
          db.con.query(sql, (error, result) => {
            if (error) {
              res.status(501).json({ msg: `${error}` });
            }
          });
        }
        res.status(200).json({ msg: "waiting for confirmation" });
      }
    } catch (err) {
      res.status(501).json({ msg: `${err}` });
    }
  } else {
    res.status(401).json({ msg: "first log in" });
  }
});




app.listen(8000, (req, res) => {
  console.log("connected");
});
