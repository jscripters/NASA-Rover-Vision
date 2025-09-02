let button = document.getElementById("submit");

button.addEventListener("click", createAcc);

function createAcc() {

    let usn = document.getElementById("username").value;
    let pwd = document.getElementById("password").value;
    
    fetch('/createAccount', {
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
        console.log("1");
        console.log(data);
        if (data.message === "Account created successfully.") {
            console.log("Account created, logging in...");
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
                console.log("2");
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
        } else {
            alert ("Account creation failed: " + (data.error || "Unknown error"));
        }
    })
    .catch(error => {
        console.log(error);
        console.error(error);
    });
}
