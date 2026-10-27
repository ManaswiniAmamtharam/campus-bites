function todayString() {
  let d = new Date();
  let month = String(d.getMonth() + 1).padStart(2, "0");
  let day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function loadSeats() {
  let date = document.getElementById("date").value;
  if (date == "") return;

  callApi("GET", "/api/seats?date=" + date, null, function (status, data) {
    let result = document.getElementById("seatResult");

    if (status != 200) {
      result.innerHTML = "<p class='error'>" + data.message + "</p>";
      return;
    }

    let output = "";
    let slotSelect = document.getElementById("slot");
    slotSelect.innerHTML = "";

    for (let i = 0; i < data.slots.length; i++) {
      let s = data.slots[i];
      let isFree = s.available > 0;
      let percent = Math.round((s.booked / data.totalSeats) * 100);

      // Bar colour depends on how full the slot is
      let fillClass = "fill-low";
      if (percent >= 85) fillClass = "fill-high";
      else if (percent >= 50) fillClass = "fill-mid";

      let badge = isFree
        ? "<span class='badge available'>Available</span>"
        : "<span class='badge soldout'>Full</span>";

      output += "<div class='card slot-card'>" +
        "<div class='row'><h3>🕒 " + s.slot + "</h3>" + badge + "</div>" +
        "<div class='bar'><div class='" + fillClass + "' style='width:" + percent + "%'></div></div>" +
        "<p class='muted'><strong>" + s.available + "</strong> of " + data.totalSeats +
        " seats left</p></div>";

      if (isFree) {
        slotSelect.innerHTML += "<option value='" + s.slot + "'>" + s.slot +
                                " (" + s.available + " left)</option>";
      }
    }

    result.innerHTML = output;
  });
}

function bookSeats() {
  let result = document.getElementById("bookingResult");

  // READ
  let name = document.getElementById("studentName").value.trim();
  let mobile = document.getElementById("mobile").value.trim();
  let date = document.getElementById("date").value;
  let slot = document.getElementById("slot").value;
  let members = Number(document.getElementById("members").value);

  // CHECK
  if (name == "" || mobile == "" || date == "" || slot == "") {
    result.innerHTML = "<p class='error'>Please fill in all fields and choose a slot.</p>";
    return;
  }
  if (mobile.length != 10 || isNaN(mobile)) {
    result.innerHTML = "<p class='error'>Mobile number must be exactly 10 digits.</p>";
    return;
  }
  if (isNaN(members) || members < 1 || members > 10) {
    result.innerHTML = "<p class='error'>Members must be between 1 and 10.</p>";
    return;
  }

  // SEND
  let booking = { name: name, mobile: mobile, date: date, slot: slot, members: members };

  callApi("POST", "/api/bookings", booking, function (status, data) {
    if (status == 201) {
      // SAVE last booking in the browser
      localStorage.setItem("bkId", data.id);
      localStorage.setItem("bkName", data.name);
      localStorage.setItem("bkDate", data.date);
      localStorage.setItem("bkSlot", data.slot);
      localStorage.setItem("bkMembers", data.members);

      result.innerHTML = "<div class='ticket'><h3>✅ Booking Confirmed!</h3>" +
        "<p>Booking ID: <strong>" + data.id + "</strong></p>" +
        "<p>Date: " + data.date + "</p>" +
        "<p>Time: " + data.slot + "</p>" +
        "<p>Members: " + data.members + "</p></div>";
      loadSeats(); // refresh the slot cards
    } else {
      result.innerHTML = "<p class='error'>" + data.message + "</p>";
    }
  });
}

function viewLastBooking() {
  let result = document.getElementById("bookingResult");
  let id = localStorage.getItem("bkId");

  if (id == null) {
    result.innerHTML = "<p class='error'>No saved booking found.</p>";
    return;
  }

  result.innerHTML = "<div class='ticket'><h3>Your Last Booking</h3>" +
    "<p>Booking ID: <strong>" + id + "</strong></p>" +
    "<p>Name: " + localStorage.getItem("bkName") + "</p>" +
    "<p>Date: " + localStorage.getItem("bkDate") + "</p>" +
    "<p>Time: " + localStorage.getItem("bkSlot") + "</p>" +
    "<p>Members: " + localStorage.getItem("bkMembers") + "</p></div>";
}

// When the page opens: set today's date and show today's availability
let dateBox = document.getElementById("date");
dateBox.min = todayString();
dateBox.value = todayString();
loadSeats();
function cancelBooking() {
  let result = document.getElementById("cancelResult");
  let id = document.getElementById("cancelId").value.trim();
  let mobile = document.getElementById("cancelMobile").value.trim();

  // CHECK
  if (id == "" || mobile == "") {
    result.innerHTML = "<p class='error'>Please enter both the Booking ID and mobile number.</p>";
    return;
  }
  if (mobile.length != 10 || isNaN(mobile)) {
    result.innerHTML = "<p class='error'>Mobile number must be exactly 10 digits.</p>";
    return;
  }
  if (!confirm("Cancel booking " + id.toUpperCase() + "?")) return;

  // SEND
  callApi("POST", "/api/bookings/cancel", { id: id, mobile: mobile }, function (status, data) {
    if (status == 200) {
      result.innerHTML = "<div class='ticket'><h3>Booking Cancelled</h3><p>" + data.message + "</p></div>";

      // Forget the saved booking if it was the one just cancelled
      if (localStorage.getItem("bkId") == data.booking.id) {
        localStorage.removeItem("bkId");
        localStorage.removeItem("bkName");
        localStorage.removeItem("bkDate");
        localStorage.removeItem("bkSlot");
        localStorage.removeItem("bkMembers");
      }

      loadSeats(); // the freed seats show up again
    } else {
      result.innerHTML = "<p class='error'>" + data.message + "</p>";
    }
  });
}

// Pre-fill the Booking ID of the last booking made in this browser
let savedId = localStorage.getItem("bkId");
if (savedId != null) {
  document.getElementById("cancelId").value = savedId;
}