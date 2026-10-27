let items = [];

function loadItems() {
  callApi("GET", "/api/items", null, function (status, data) {
    if (status == 200) {
      items = data;
      showItems();
    } else {
      document.getElementById("result").innerHTML =
        "<p class='error center'>" + data.message + "</p>";
    }
  });
}

function showItems() {
  let category = document.getElementById("category").value;
  let statusFilter = document.getElementById("status").value;

  let output = "<div class='grid'>";
  let shown = 0;

  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let status = item.quantity > 0 ? "Available" : "Sold Out";

    if ((category == "All" || item.category == category) &&
        (statusFilter == "All" || status == statusFilter)) {

      // Decide the badge
      let badgeClass = "available";
      let badgeText = "Available";
      let cardClass = "card food-card";

      if (item.quantity == 0) {
        badgeClass = "soldout";
        badgeText = "Sold Out";
        cardClass += " out";
      } else if (item.quantity <= 10) {
        badgeClass = "low";
        badgeText = "Only " + item.quantity + " left";
      }

      // The photo falls back to placeholder.svg if the file is missing
      output += "<div class='" + cardClass + "'>" +
        "<img src='" + item.image + "' alt='" + item.name + "' " +
        "onerror=\"this.onerror=null;this.src='images/placeholder.svg';\">" +
        "<div class='food-body'>" +
        "<h3>" + item.name + "</h3>" +
        "<p class='muted'>" + item.category + "</p>" +
        "<div class='row'><span class='price'>&#8377;" + item.price + "</span>" +
        "<span class='badge " + badgeClass + "'>" + badgeText + "</span></div>" +
        "<p class='muted'>Quantity: " + item.quantity + "</p></div></div>";
      shown++;
    }
  }

  output += "</div>";

  if (shown == 0) {
    output = "<p class='muted center'>No items match your filters.</p>";
  }

  document.getElementById("result").innerHTML = output;
}

loadItems();
setInterval(loadItems, 10000);