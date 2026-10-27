// Prevents text typed by customers from being run as HTML
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function todayString() {
  let d = new Date();
  let month = String(d.getMonth() + 1).padStart(2, "0");
  let day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

// If the server says "not logged in", send the staff member back to login
function sessionExpired(status) {
  if (status == 401) {
    sessionStorage.removeItem("staffToken");
    alert("Session expired. Please log in again.");
    location.reload();
    return true;
  }
  return false;
}

// ---------- LOGIN / LOGOUT ----------
function login() {
  let password = document.getElementById("password").value;
  let msg = document.getElementById("loginMsg");

  if (password == "") {
    msg.innerHTML = "<p class='error'>Please enter the password.</p>";
    return;
  }

  callApi("POST", "/api/staff/login", { password: password }, function (status, data) {
    if (status == 200) {
      sessionStorage.setItem("staffToken", data.token);
      showDashboard();
    } else {
      msg.innerHTML = "<p class='error'>" + data.message + "</p>";
    }
  });
}

function logout() {
  callApi("POST", "/api/staff/logout", null, function () {});
  sessionStorage.removeItem("staffToken");
  location.reload();
}

function showDashboard() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  document.getElementById("bookingDate").value = todayString();
  loadStock();
  loadSeatInfo();
  loadBookings();
}

// ---------- 1. FOOD STOCK ----------
function loadStock() {
  callApi("GET", "/api/items", null, function (status, data) {
    if (status != 200) return;

    let output = "<table><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Action</th></tr>";

    for (let i = 0; i < data.length; i++) {
      let item = data[i];
      output += "<tr><td>" + item.name + "</td><td>" + item.category + "</td>" +
        "<td><input type='number' min='0' max='500' id='qty" + item.id +
        "' value='" + item.quantity + "'></td>" +
        "<td><button class='btn small' onclick='updateStock(" + item.id + ")'>Update</button>" +
        "<button class='btn small btn-light' onclick='soldOut(" + item.id + ")'>Mark Sold Out</button></td></tr>";
    }

    output += "</table>";
    document.getElementById("stockTable").innerHTML = output;
  });
}

function updateStock(id) {
  let box = document.getElementById("qty" + id);
  let msg = document.getElementById("stockMsg");

  if (box.value.trim() == "") {
    msg.innerHTML = "<p class='error'>Please enter a quantity.</p>";
    return;
  }

  let quantity = Number(box.value);
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 500) {
    msg.innerHTML = "<p class='error'>Quantity must be a whole number from 0 to 500.</p>";
    return;
  }

  callApi("PUT", "/api/staff/items/" + id, { quantity: quantity }, function (status, data) {
    if (sessionExpired(status)) return;

    if (status == 200) {
      msg.innerHTML = "<p class='success'>Updated " + data.name + " to " + data.quantity + ".</p>";
    } else {
      msg.innerHTML = "<p class='error'>" + data.message + "</p>";
    }
  });
}

function soldOut(id) {
  document.getElementById("qty" + id).value = 0;
  updateStock(id);
}

// ---------- 2. SEAT CAPACITY ----------
function loadSeatInfo() {
  callApi("GET", "/api/seats", null, function (status, data) {
    if (status != 200) return;
    document.getElementById("currentSeats").innerHTML = data.totalSeats;
    document.getElementById("totalSeats").value = data.totalSeats;
  });
}

function updateSeats() {
  let msg = document.getElementById("seatMsg");
  let raw = document.getElementById("totalSeats").value.trim();
  let total = Number(raw);

  if (raw == "" || !Number.isInteger(total) || total < 10 || total > 500) {
    msg.innerHTML = "<p class='error'>Enter a whole number from 10 to 500.</p>";
    return;
  }

  callApi("PUT", "/api/staff/seats", { totalSeats: total }, function (status, data) {
    if (sessionExpired(status)) return;

    if (status == 200) {
      msg.innerHTML = "<p class='success'>Seats per slot updated to " + data.totalSeats + ".</p>";
      loadSeatInfo();
    } else {
      msg.innerHTML = "<p class='error'>" + data.message + "</p>";
    }
  });
}

// ---------- 3. BOOKINGS ----------
function loadBookings() {
  let date = document.getElementById("bookingDate").value;
  if (date == "") return;

  callApi("GET", "/api/staff/bookings?date=" + date, null, function (status, data) {
    if (sessionExpired(status)) return;

    let table = document.getElementById("bookingTable");

    if (status != 200) {
      table.innerHTML = "<p class='error'>" + data.message + "</p>";
      return;
    }
    if (data.length == 0) {
      table.innerHTML = "<p class='muted'>No bookings for this date.</p>";
      return;
    }

    let totalMembers = 0;
    let output = "<table><tr><th>ID</th><th>Name</th><th>Mobile</th>" +
                 "<th>Time Slot</th><th>Members</th><th>Action</th></tr>";

    for (let i = 0; i < data.length; i++) {
      let b = data[i];
      totalMembers += b.members;
      output += "<tr><td>" + escapeHtml(b.id) + "</td><td>" + escapeHtml(b.name) + "</td><td>" +
                escapeHtml(b.mobile) + "</td><td>" + escapeHtml(b.slot) + "</td><td>" +
                b.members + "</td><td><button class='btn small danger' onclick=\"cancelBooking('" +
                escapeHtml(b.id) + "')\">Cancel</button></td></tr>";
    }

    output += "</table><p class='muted'>" + data.length + " booking(s), " +
              totalMembers + " member(s) in total.</p>";
    table.innerHTML = output;
  });
}

function cancelBooking(id) {
  if (!confirm("Cancel booking " + id + "?")) return;

  callApi("DELETE", "/api/staff/bookings/" + id, null, function (status, data) {
    if (sessionExpired(status)) return;
    document.getElementById("bookingMsg").innerHTML = "<p class='success'>" + data.message + "</p>";
    loadBookings();
  });
}

// If staff already logged in during this browser tab, go straight to the dashboard
if (sessionStorage.getItem("staffToken") != null) {
  showDashboard();
}