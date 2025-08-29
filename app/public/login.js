document.addEventListener("DOMContentLoaded", () => {
  const submitButton = document.getElementById("submit");
  submitButton.addEventListener("click", function(event) {
    event.preventDefault();
    login();
  });
});

function login(){
    let usn = document.getElementById("username").value;
    let pwd = document.getElementById("password").value;

    if (!usn || !pwd) {
        alert("Please enter username and password.");
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: usn,
            password: pwd
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Login successful.") {
            sessionStorage.setItem('username', usn);
            window.location.href = "/home";
        } else {
            alert("Login failed: " + (data.error || "Unknown error"));
        }
    })
    .catch(error => {
        alert("An error occurred. Please try again.");
    });
}
