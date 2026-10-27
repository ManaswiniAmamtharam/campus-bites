const express = require("express");
const crypto = require("crypto");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// STAFF LOGIN SETTINGS
const STAFF_PASSWORD = "staff123";
let staffTokens = [];

// FOOD ITEMS
const items = [
  { id: 1, name: "Veg Biryani", category: "Meals", price: 60, quantity: 25, image: "images/veg-biryani.jpg" },
  { id: 2, name: "Chicken Biryani", category: "Meals", price: 90, quantity: 0, image: "images/chicken-biryani.jpg" },
  { id: 3, name: "Masala Dosa", category: "Tiffin", price: 40, quantity: 12, image: "images/masala-dosa.jpg" },
  { id: 4, name: "Idli (2 pcs)", category: "Tiffin", price: 25, quantity: 30, image: "images/idli.jpg" },
  { id: 5, name: "Samosa", category: "Snacks", price: 15, quantity: 0, image: "images/samosa.jpg" },
  { id: 6, name: "Veg Puff", category: "Snacks", price: 20, quantity: 18, image: "images/veg-puff.jpg" },
  { id: 7, name: "Tea", category: "Beverages", price: 10, quantity: 50, image: "images/tea.jpg" },
  { id: 8, name: "Cold Coffee", category: "Beverages", price: 35, quantity: 8, image: "images/cold-coffee.jpg" }
];

// SEATS
let TOTAL_SEATS = 60;

const SLOTS = [
  "08:00 AM - 10:00 AM",
  "11:30 AM - 01:00 PM",
  "01:00 PM - 03:00 PM",
  "03:00 PM - 05:00 PM"
];

let bookings = [];
let bookingCounter = 0;

// HELPER FUNCTIONS

function todayString() {
  const d = new Date();

  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

// GENERATE CUSTOM BOOKING ID
function generateBookingId(mobile) {
  const d = new Date();

  const datePart =
    String(d.getDate()).padStart(2, "0") +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getFullYear()).slice(-2);

  const phonePart = mobile.slice(-2);

  bookingCounter++;

  const counterPart = String(bookingCounter).padStart(3, "0");

  return "CB" + datePart + phonePart + counterPart;
}

function seatsBooked(date, slot) {
  let total = 0;

  for (let i = 0; i < bookings.length; i++) {
    if (bookings[i].date === date && bookings[i].slot === slot) {
      total += bookings[i].members;
    }
  }

  return total;
}

function maxBookedInAnySlot() {
  const totals = {};
  let max = 0;

  for (let i = 0; i < bookings.length; i++) {
    const key = bookings[i].date + "|" + bookings[i].slot;

    totals[key] = (totals[key] || 0) + bookings[i].members;

    if (totals[key] > max) {
      max = totals[key];
    }
  }

  return max;
}

// STAFF AUTHENTICATION MIDDLEWARE
function requireStaff(req, res, next) {
  const token = req.headers["x-staff-token"];

  if (staffTokens.includes(token)) {
    next();
  } else {
    res.status(401).json({
      message: "Please log in as staff."
    });
  }
}

// PUBLIC ROUTES

// 1. GET FOOD ITEMS
app.get("/api/items", function (req, res) {
  res.json(items);
});

// 2. GET SEAT AVAILABILITY
app.get("/api/seats", function (req, res) {
  const date = req.query.date || todayString();

  const slots = SLOTS.map(function (slot) {
    const booked = seatsBooked(date, slot);

    return {
      slot: slot,
      booked: booked,
      available: TOTAL_SEATS - booked
    };
  });

  res.json({
    date: date,
    totalSeats: TOTAL_SEATS,
    slots: slots
  });
});

// 3. BOOK SEATS WITH CUSTOM BOOKING ID
app.post("/api/bookings", function (req, res) {
  const name = String(req.body.name || "").trim();
  const mobile = String(req.body.mobile || "").trim();
  const date = String(req.body.date || "").trim();
  const slot = String(req.body.slot || "").trim();
  const members = Number(req.body.members);

  if (name === "") {
    return res.status(400).json({
      message: "Name is required."
    });
  }

  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({
      message: "Mobile must be 10 digits."
    });
  }

  if (date < todayString()) {
    return res.status(400).json({
      message: "Choose today or a future date."
    });
  }

  if (!SLOTS.includes(slot)) {
    return res.status(400).json({
      message: "Invalid time slot."
    });
  }

  if (!Number.isInteger(members) || members < 1 || members > 10) {
    return res.status(400).json({
      message: "Members must be between 1 and 10."
    });
  }

  const available = TOTAL_SEATS - seatsBooked(date, slot);

  if (members > available) {
    return res.status(409).json({
      message: "Only " + available + " seat(s) left in this slot."
    });
  }

  const booking = {
    id: generateBookingId(mobile),
    name: name,
    mobile: mobile,
    date: date,
    slot: slot,
    members: members
  };

  bookings.push(booking);

  res.status(201).json(booking);
});

// 4. CUSTOMER CANCELS THEIR BOOKING
app.post("/api/bookings/cancel", function (req, res) {
  const id = String(req.body.id || "").trim().toUpperCase();
  const mobile = String(req.body.mobile || "").trim();

  const index = bookings.findIndex(function (b) {
    return b.id === id && b.mobile === mobile;
  });

  if (index === -1) {
    return res.status(404).json({
      message: "No booking found with that ID and mobile number."
    });
  }

  const removed = bookings.splice(index, 1)[0];

  res.json({
    message: "Booking " + removed.id + " cancelled.",
    booking: removed
  });
});

// STAFF ROUTES

// 5. STAFF LOGIN
app.post("/api/staff/login", function (req, res) {
  if (req.body.password === STAFF_PASSWORD) {
    const token = crypto.randomBytes(16).toString("hex");

    staffTokens.push(token);

    res.json({
      token: token
    });
  } else {
    res.status(401).json({
      message: "Incorrect password."
    });
  }
});

// 6. STAFF LOGOUT
app.post("/api/staff/logout", function (req, res) {
  const token = req.headers["x-staff-token"];

  staffTokens = staffTokens.filter(function (t) {
    return t !== token;
  });

  res.json({
    message: "Logged out."
  });
});

// 7. UPDATE FOOD QUANTITY
app.put("/api/staff/items/:id", requireStaff, function (req, res) {
  const item = items.find(function (i) {
    return i.id === Number(req.params.id);
  });

  if (!item) {
    return res.status(404).json({
      message: "Item not found."
    });
  }

  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 500) {
    return res.status(400).json({
      message: "Quantity must be a whole number from 0 to 500."
    });
  }

  item.quantity = quantity;

  res.json(item);
});

// 8. UPDATE TOTAL SEATS
app.put("/api/staff/seats", requireStaff, function (req, res) {
  const total = Number(req.body.totalSeats);

  if (!Number.isInteger(total) || total < 10 || total > 500) {
    return res.status(400).json({
      message: "Seats must be a whole number from 10 to 500."
    });
  }

  const most = maxBookedInAnySlot();

  if (total < most) {
    return res.status(409).json({
      message: "Cannot go below " + most +
        " seats, because that many are already booked in one slot."
    });
  }

  TOTAL_SEATS = total;

  res.json({
    totalSeats: TOTAL_SEATS
  });
});

// 9. GET BOOKINGS FOR A DATE
app.get("/api/staff/bookings", requireStaff, function (req, res) {
  const date = req.query.date || todayString();

  res.json(
    bookings.filter(function (b) {
      return b.date === date;
    })
  );
});

// 10. STAFF CANCELS A BOOKING
app.delete("/api/staff/bookings/:id", requireStaff, function (req, res) {
  const index = bookings.findIndex(function (b) {
    return b.id === req.params.id;
  });

  if (index === -1) {
    return res.status(404).json({
      message: "Booking not found."
    });
  }

  const removed = bookings.splice(index, 1)[0];

  res.json({
    message: "Booking " + removed.id + " cancelled.",
    booking: removed
  });
});

// START SERVER
app.listen(3000, function () {
  console.log("Cafeteria Server Started at http://localhost:3000");
});
