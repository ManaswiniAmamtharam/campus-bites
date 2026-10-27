function loadStats() {
  // Food items available
  callApi("GET", "/api/items", null, function (status, data) {
    if (status != 200) return;

    let count = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i].quantity > 0) count++;
    }
    document.getElementById("statItems").innerHTML = count + " / " + data.length;
  });

  // Seats free today
  callApi("GET", "/api/seats", null, function (status, data) {
    if (status != 200) return;

    let freeSeats = 0;
    let openSlots = 0;
    for (let i = 0; i < data.slots.length; i++) {
      freeSeats += data.slots[i].available;
      if (data.slots[i].available > 0) openSlots++;
    }
    document.getElementById("statSeats").innerHTML = freeSeats;
    document.getElementById("statSlots").innerHTML = openSlots + " / " + data.slots.length;
  });
}

function loadTimings() {
  let xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      let xmlDoc = xhttp.responseXML;
      let names = xmlDoc.getElementsByTagName("name");
      let locations = xmlDoc.getElementsByTagName("location");
      let hours = xmlDoc.getElementsByTagName("hours");
      let contacts = xmlDoc.getElementsByTagName("contact");

      let output = "<div class='grid'>";

      for (let i = 0; i < names.length; i++) {
        output += "<div class='card'>" +
                  "<h3>" + names[i].textContent + "</h3>" +
                  "<p class='muted'>📍 " + locations[i].textContent + "</p>" +
                  "<p>🕒 " + hours[i].textContent + "</p>" +
                  "<p class='muted'>📞 " + contacts[i].textContent + "</p></div>";
      }

      output += "</div>";
      document.getElementById("timingResult").innerHTML = output;
    }
  };

  xhttp.open("GET", "timings.xml", true);
  xhttp.send();
}

// Run when the page opens
loadStats();
loadTimings();