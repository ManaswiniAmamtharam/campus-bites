let categories = ["Food Quality", "Hygiene", "Pricing", "Availability", "Other"];

function submitFeedback() {
  let result = document.getElementById("result");

  try {
    // READ
    let name = document.getElementById("studentName").value;
    let mobile = document.getElementById("mobile").value;
    let category = document.getElementById("category").value;
    let comment = document.getElementById("comment").value;

    // CLEAN
    name = name.trim();
    mobile = mobile.trim();
    comment = comment.trim();

    // CHECK
    if (name == "" || mobile == "" || comment == "") {
      result.innerHTML = "<p class='error'>Please fill in all fields.</p>";
      return;
    }
    if (mobile.length != 10 || isNaN(mobile)) {
      result.innerHTML = "<p class='error'>Mobile number must be exactly 10 digits.</p>";
      return;
    }
    if (!categories.includes(category)) {
      result.innerHTML = "<p class='error'>Please select a valid category.</p>";
      return;
    }

    // GENERATE ID AND DATE
    let feedbackId = "FB" + Math.floor(Math.random() * 10000);
    let today = new Date();
    let date = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();

    // SAVE
    localStorage.setItem("fbId", feedbackId);
    localStorage.setItem("fbName", name.toUpperCase());
    localStorage.setItem("fbCategory", category);
    localStorage.setItem("fbComment", comment);
    localStorage.setItem("fbDate", date);

    // DISPLAY
    result.innerHTML = "<div class='ticket'><h3>Feedback Submitted!</h3>" +
      "<p>ID: <strong>" + feedbackId + "</strong></p>" +
      "<p>Date: " + date + "</p></div>";
  } catch (error) {
    result.innerHTML = "<p class='error'>Something went wrong: " + error.message + "</p>";
  }
}

function viewFeedback() {
  let result = document.getElementById("result");
  let id = localStorage.getItem("fbId");

  if (id == null) {
    result.innerHTML = "<p class='error'>No saved feedback found.</p>";
    return;
  }

  result.innerHTML = "<div class='ticket'><h3>Saved Feedback</h3>" +
    "<p>ID: " + id + "</p>" +
    "<p>Name: " + localStorage.getItem("fbName") + "</p>" +
    "<p>Category: " + localStorage.getItem("fbCategory") + "</p>" +
    "<p>Comment: " + localStorage.getItem("fbComment") + "</p>" +
    "<p>Date: " + localStorage.getItem("fbDate") + "</p></div>";
}