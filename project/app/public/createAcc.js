let button = document.getElementById("submit");
let usn = document.getElementById("username").value;
let pwd = document.getElementById("password").value;
button.addEventListener("click", createAcc);

function createAcc() {
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
        console.log(data);
        
    })
    .catch(error => {
        console.error(error);
    });
}
