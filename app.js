const express = require("express");
const bodyParser = require("body-parser");
const lodash = require("lodash");
const ejs = require("ejs");
const mysql = require("mysql");

const PUBLISHABLE_KEY = "pk_test_51JnGTaSGBxXYWMcgShxBFlUhdfw5Af8IKZUx6lZB1L32tjxPTrG78y3oszh5B61UBkqliAXJelR1pruXGMoScygR00izARksir"
const SECERT_KEY = "sk_test_51JnGTaSGBxXYWMcg58vxiBoSkEIdehO7Rkww0XiNoyMaqEEBNC11TldIpkM4nuO1Kru2qI1vsRZ22uHvO2EILsoK004yR6CJqb"

const stripe = require('stripe')(SECERT_KEY)
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');


var db_config = {
  host: "remotemysql.com",
  user: "TW0TYh9e65",
  port: 3306,
  database: "TW0TYh9e65",
  password: "6HYRxv7Xj8"
};

var connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config);

  connection.connect(function (err) {
    if (err) {
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } else {
      console.log("Connected to database");
    }
  });

  connection.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else { // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

handleDisconnect();

let newUserUrl = "/Register";
let rentId;
let issueId;

app.get("/", function (req, res) {
  if (newUserUrl === "/Register") {
    res.render("home");
  } else {
    res.render("newUser", {
      newUser: newUserUrl
    });
  }
});

app.get("/Register", function (req, res) {
  res.render("register", {
    newUser: newUserUrl
  });
});

app.get("/Contact-Us", function (req, res) {
  res.render("contact", {
    newUser: newUserUrl
  });
});

app.get("/Developers", function (req, res) {
  res.render("developers");
});

app.get("/Choose-Car", function (req, res) {
  res.render("carlist", {
    newUser: newUserUrl
  });
});

app.get("/rentCar/:carName", function (req, res) {
  const car_img = req.params.carName;
  let carModel = lodash.toUpper(req.params.carName);
  let carAvail = "";
  let sql = "SELECT * FROM car WHERE Car_model ='" + carModel + "'";
  connection.query(sql, function (err, findCar) {
    if (err) {
      console.log(err);
    } else {
      console.log(findCar[0].Avail_flag);
      if (findCar[0].Avail_flag === 'A') {
        carAvail = "Available";
      } else {
        carAvail = "Not-Available";
      }

      let sql2 = "SELECT Location_name FROM location WHERE Location_id = '" + findCar[0].Location_id + "' ";
      connection.query(sql2, function (err, findLocation) {
        if (err) {
          console.log(err);
        } else {
          res.render("rent", {
            newUser: newUserUrl,
            carImage: car_img,
            carDetail: findCar[0],
            avail: carAvail,
            locationName: findLocation[0].Location_name
          });
        }
      });
    }
  });
});

app.get("/Register/:user", function (req, res) {
  const userName = lodash.capitalize(req.params.user);

  let sql2 = "SELECT * FROM customer WHERE Customer_id='" + userName + "'";

  connection.query(sql2, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      res.render("user", {
        user: foundUser[0]
      });
    }
  });
});

app.post("/Register", function (req, res) {

  let sql = "INSERT INTO customer VALUES('" + req.body.username + "','" + req.body.password + "','" + req.body.firstName + "','" + req.body.lastName + "','" + req.body.aadharNo + "','" + req.body.address + "','" + req.body.contact + "','" + req.body.email + "')";
  connection.query(sql, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Inserted");
    }
  });
  res.redirect("/Register");
});

app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  let sql = "SELECT Customer_id,Password FROM customer WHERE Customer_id='" + username + "'";
  connection.query(sql, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      if (result[0].Password === password) {
        let sql2 = "SELECT * FROM customer WHERE Customer_id='" + username + "'";

        connection.query(sql2, function (err, foundUser) {
          if (err) {
            console.log(err);
          } else {
            newUserUrl = "/Register/" + username;
            res.redirect("/");
          }
        });

      } else {
        console.log("Username doesnot exist signup first");
        res.redirect("/Register");
      }
    }
  });
});

app.post("/logout", function (req, res) {
  newUserUrl = "/Register";
  res.redirect("/");
})

let user_details = {
  rent_i: 0,
  from_date: new Date("2021-01-20"),
  to_date: new Date("2021-01-20"),
  plate: "",
  cust_id: "",
  pick: "",
  drop: "",
  interval: "",
  amt: ""
};

app.post("/rent", function (req, res) {

  user_details.from_date = new Date(req.body.fromDate);
  user_details.to_date = new Date(req.body.returnDate);
  user_details.plate = req.body.plateNo;
  user_details.pick = req.body.pickup_id;
  user_details.drop = req.body.drop_id;
  user_details.amt = 0;

  let sql = "SELECT * FROM car WHERE Plate_no ='" + user_details.plate + "'";
  connection.query(sql, function (err, findCar) {
    if (err) {
      console.log(err);
    } else {
      console.log(findCar[0].RentPerday);
      console.log(user_details.from_date);
      console.log(user_details.to_date);
      user_details.interval = (Math.abs(user_details.to_date - user_details.from_date)) / (1000 * 60 * 60 * 24);
      console.log(user_details.interval);
      user_details.amt = user_details.interval * findCar[0].RentPerday * 100;
      console.log(user_details.amt);
      res.render("payment", {
        amount: user_details.amt,
        newUser: newUserUrl,
        key: PUBLISHABLE_KEY
      });
    }
  });
});

app.post("/payment", (req, res) => {
  stripe.customers.create({
    email: req.body.stripeEmail,
    source: req.body.stripeToken,
    name: 'Gaurav Saini',
    address: {
      line1: '510 Townsend St',
      postal_code: '98140',
      city: 'San Francisco',
      state: 'CA',
      country: 'US'
    }
  })
    .then((customer) => {
      return stripe.charges.create({
        amount: 7000,
        description: 'Web Development Project',
        currency: 'USD',
        customer: customer.id
      })
    })
    .then((charge) => {
      // console.log(charge)

      let sql4 = "SELECT Rent_id FROM rent WHERE Rent_id=(SELECT max(Rent_id) FROM rent)";
      connection.query(sql4, function (err, id) {
        if (err) {
          console.log(err);
        } else {
          rentId = id[0].Rent_id + 1;
        }
      });
      const userName = newUserUrl.substring(10);
      console.log(userName);
      let sql = "SELECT Customer_id FROM customer WHERE Customer_id='" + userName + "' ";
      connection.query(sql, function (err, found) {
        if (err) {
          console.log(err);
        } else {
          console.log(found);
          if (found === []) {
            res.redirect("/Register");
          } else {

            //console.log(req.body.fromDate);

            let sql2 = "INSERT INTO rent VALUES('" + rentId + "','" + user_details.from_date + "','" + user_details.to_date + "','" + user_details.plate + "','" + userName + "','" + user_details.pick + "','" + user_details.drop + "','" + user_details.amt + "')";
            connection.query(sql2, function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log("Booked");
              }
            });

            let sql3 = "UPDATE car SET Avail_flag = 'N' WHERE car.Plate_no = '" + user_details.plate + "' ";
            connection.query(sql3, function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log("updated car table");
              }
            });

            res.render("success");

          }
        }
      })
    })
    .catch((err) => {
      res.send(err)
    })
})

// app.post("/signOut", function (req, res) {
//   res.render("signout", {
//     username: customer
//   });
// });

app.post("/issues", function (req, res) {
  let sql = "SELECT Issue_id FROM issue WHERE Issue_id=(SELECT max(Issue_id) FROM issue)";
  connection.query(sql, function (err, id) {
    if (err) {
      console.log(err);
    } else {
      issueId = id[0].Issue_id;
      issueId++;
      // console.log(issueId);
      let sql2 = "INSERT INTO issue VALUES('" + issueId + "','" + req.body.userName + "','" + req.body.name + "','" + req.body.userMail + "','" + req.body.userMessage + "')";
      connection.query(sql2, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Registered");
        }
      });
      res.redirect("/");
    }
  });

});

app.listen(process.env.PORT || 3000, function () {
  console.log("The server has started successfully!");
});
