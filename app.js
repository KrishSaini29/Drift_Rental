const express = require("express");
const bodyParser = require("body-parser");
const lodash = require("lodash");
const ejs = require("ejs");
// const mysql = require("mysql");
const mongoose = require("mongoose");
const customer = require("./models/customer");
const car = require("./models/car");
const location = require("./models/location");

const PUBLISHABLE_KEY =
  "pk_test_51JnGTaSGBxXYWMcgShxBFlUhdfw5Af8IKZUx6lZB1L32tjxPTrG78y3oszh5B61UBkqliAXJelR1pruXGMoScygR00izARksir";
const SECERT_KEY =
  "sk_test_51JnGTaSGBxXYWMcg58vxiBoSkEIdehO7Rkww0XiNoyMaqEEBNC11TldIpkM4nuO1Kru2qI1vsRZ22uHvO2EILsoK004yR6CJqb";

const stripe = require("stripe")(SECERT_KEY);
const app = express();

app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.set("view engine", "ejs");

let newUserUrl = "/Register";
let cust;
let issueId;

app.get("/", function (req, res) {
  if (newUserUrl === "/Register") {
    res.render("home");
  } else {
    res.render("newUser", {
      newUser: newUserUrl,
    });
  }
});

app.get("/Register", function (req, res) {
  res.render("register", {
    newUser: newUserUrl,
  });
});

app.get("/Contact-Us", function (req, res) {
  res.render("contact", {
    newUser: newUserUrl,
  });
});

app.get("/Developers", function (req, res) {
  res.render("developers");
});

app.get("/Choose-Car", function (req, res) {
  res.render("carlist", {
    newUser: newUserUrl,
  });
});

app.get("/rentCar/:carName", async function (req, res) {
  const car_img = req.params.carName;
  let carModel = lodash.toUpper(req.params.carName);
  let carAvail = "Unavailable";
  let existingCar;
  try {
    existingCar = await car.findOne({ model: carModel });
  } catch (err) {
    console.log(err);
  }
  let isLocated;
  if (existingCar) {
    if (existingCar.isAvailable) carAvail = "Available";
    isLocated = await location.findById(existingCar.location);
  }
  if (isLocated) {
    res.render("rent", {
      newUser: newUserUrl,
      carImage: car_img,
      carDetail: existingCar,
      avail: carAvail,
      location: isLocated.name,
    });
  } else {
    res.redirect("/rentCar/:" + car_img);
  }
});

app.get("/Register/:user", function (req, res) {
  const userName = lodash.capitalize(req.params.user);

  let sql2 = "SELECT * FROM customer WHERE Customer_id='" + userName + "'";

  connection.query(sql2, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      res.render("user", {
        user: foundUser[0],
      });
    }
  });
});

app.post("/Register", async function (req, res) {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    aadharNo,
    address,
    contact,
  } = req.body;
  let existingUser;
  try {
    existingUser = await customer.findOne({ email: email });
  } catch (err) {
    console.log("Couldn't signup, please try again later with error code: 500");
  }
  if (existingUser) {
    console.log("User already exists! with error code: 422");
  }
  const newCustomer = new customer({
    userName: username,
    email,
    password,
    fname: firstName,
    lname: lastName,
    aadhaar: aadharNo,
    address,
    contact,
  });

  try {
    await newCustomer.save();
  } catch (err) {
    console.log("Signup user failed with error code : 500");
  }
  res.redirect("/Register");
});

app.post("/login", async (req, res) => {
  const { email, username, password } = req.body;
  let existingUser;

  try {
    existingUser = await customer.findOne({ email: email });
  } catch (err) {
    console.log(err);
  }
  if (!existingUser) {
    console.log("Couldn't identify the user");
  }
  let isPasswordValid = true;
  if (existingUser && password !== existingUser.password) {
    console.log("Password Invalid");
    isPasswordValid = false;
  }
  if (isPasswordValid) {
    console.log("Logged In");
    cust = username;
    newUserUrl = "/Register/" + username;
  }
  res.redirect("/");
});

app.post("/logout", function (req, res) {
  newUserUrl = "/Register";
  res.redirect("/");
});

let customer_details = {
  rent_i: 0,
  from_date: new Date("2021-01-20"),
  to_date: new Date("2021-01-20"),
  plate: "",
  cust_id: "",
  pick: "",
  drop: "",
  interval: 0,
  amt: 0,
};

app.post("/rent", async function (req, res) {
  customer_details.from_date = new Date(req.body.fromDate);
  customer_details.to_date = new Date(req.body.returnDate);
  customer_details.plate = req.body.plateNo;
  customer_details.pick = req.body.pickup_id;
  customer_details.drop = req.body.drop_id;
  customer_details.amt = 0;

  let existingCar;
  try {
    existingCar = await car.findOne({ plateNo: customer_details.plate });
  } catch (err) {
    console.log(err);
  }
  if (existingCar) {
    customer_details.interval =
      +Math.abs(customer_details.to_date - customer_details.from_date) /
      (1000 * 60 * 60 * 24);
    customer_details.amt =
      customer_details.interval * existingCar.rentPerDay * 100;
    res.render("payment", {
      amount: customer_details.amt,
      newUser: newUserUrl,
      key: PUBLISHABLE_KEY,
    });
  }
});

app.post("/payment", async function (req, res) {
  stripe.customers
    .create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken,
      name: "Gaurav Saini",
      address: {
        line1: "510 Townsend St",
        postal_code: "98140",
        city: "San Francisco",
        state: "CA",
        country: "US",
      },
    })
    .then((customer) => {
      return stripe.charges.create({
        amount: 7000,
        description: "Web Development Project",
        currency: "USD",
        customer: customer.id,
      });
    })
    .then(async (charge) => {
      console.log(cust);
      const userName = newUserUrl.substring(10);
      console.log(userName);

      let existingCustomer;
      try {
        existingCustomer = await customer.findOne({ userName: userName });
      } catch (err) {
        console.log(err);
      }

      let existingCar;
      try {
        existingCar = await car.findOne({ plateNo: customer_details.plate });
      } catch (err) {
        console.log(err);
      }

      if (existingCustomer && existingCar) {
        const newRent = new rent({
          fromDate: customer_details.from_date,
          returnDate: customer_details.to_date,
          pickupLocation: customer_details.pick,
          dropLocation: customer_details.drop,
          customer: existingCustomer._id,
          car: existingCar._id,
          location: existingCar.location,
        });
        try {
          await newRent.save();
        } catch (err) {
          console.log(err);
        }
      }

      //       let sql3 =
      //         "UPDATE car SET Avail_flag = 'N' WHERE car.Plate_no = '" +
      //         customer_details.plate +
      //         "' ";
      //       connection.query(sql3, function (err) {
      //         if (err) {
      //           console.log(err);
      //         } else {
      //           console.log("updated car table");
      //         }
      //       });

      //       res.render("success");
      //     }
      //   }
      // });
    })
    .catch((err) => {
      res.send(err);
    });
  res.render("success");
});

// app.post("/signOut", function (req, res) {
//   res.render("signout", {
//     username: customer
//   });
// });

app.post("/issues", function (req, res) {
  let sql =
    "SELECT Issue_id FROM issue WHERE Issue_id=(SELECT max(Issue_id) FROM issue)";
  connection.query(sql, function (err, id) {
    if (err) {
      console.log(err);
    } else {
      issueId = id[0].Issue_id;
      issueId++;
      // console.log(issueId);
      let sql2 =
        "INSERT INTO issue VALUES('" +
        issueId +
        "','" +
        req.body.userName +
        "','" +
        req.body.name +
        "','" +
        req.body.userMail +
        "','" +
        req.body.userMessage +
        "')";
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

mongoose
  .connect(
    "mongodb+srv://gaurav31200:a8I4JfxoLQUTOpd3@cluster0.r950i.mongodb.net/DRIFT?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Connected");
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
// app.listen(process.env.PORT || 3000, function () {
//   console.log("The server has started successfully!");
// });
