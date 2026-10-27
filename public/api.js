// method: "GET", "POST", "PUT" or "DELETE"
// data: object to send (use null when sending nothing)
// done: function(status, responseObject) that runs when the reply arrives
function callApi(method, url, data, done) {
  let xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == 4) {
      let response;
      try {
        response = JSON.parse(xhttp.responseText);
      } catch (error) {
        response = { message: "Server unavailable. Please try again later." };
      }
      done(xhttp.status, response);
    }
  };

  xhttp.open(method, url, true);

  // Staff pages: send the login token with every request
  let token = sessionStorage.getItem("staffToken");
  if (token != null) {
    xhttp.setRequestHeader("x-staff-token", token);
  }

  if (data != null) {
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(data));
  } else {
    xhttp.send();
  }
}