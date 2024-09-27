let token = "";     //Token will be stored here after login
let count = 0;      //Initialize the count globally

//To check if there's a saved count in LocalStorage
// window.onload = function() {
//     const savedCount = localStorage.getItem("count");
//     if(savedCount){
//         count = parseInt(savedCount); //get the saved value from localStorage and convert it to an integer
//         document.getElementById('counter-value').innerHTML = count; // Display the saved count
//     }
// };


//Handle Authentication(login/register)
document.getElementById("auth-form").addEventListener("submit", async function(event) {
    event.preventDefault();     // This prevents the form from reloading the page
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    //Make a request to the backend to register/login
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if(response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);  //store the token
            document.getElementById("auth-message").innerHTML = "Login successful!";
            document.querySelector(".auth-section").style.display = "none";
            document.querySelector(".counter-section").style.display = "block"; // Show the counter section after login
            await loadCounter();  //Load the user's counter after login
        } else {
            document.getElementById("auth-message").innerHTML = "Login failed. Try registering!";
            await registerUser(username, password); //If login fails, register the user
        }
    } catch (error) {
        console.error("Error during authentication:", error);
    } 
});


//Register new user if not already registered
async function registerUser(username, password) {
    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username, password})
        });

        if(response.ok){
            document.getElementById("auth-message").innerHTML = "Registration successful! Please login.";
        } else {
            document.getElementById("auth-message").innerHTML = "Registration failed! Please try again.";
        }

    } catch (error) {
        console.error("Error during registration:", error);
    }
}

//Load counter from the backend after login
async function loadCounter() {
    const token = localStorage.getItem('token');    //Retrieve the token
    if(!token) {
        window.location.href = 'index.html';    //Redirect if no token
        return;     //Stop the further execution
    }

    try {
        const response = await fetch('http://localhost:3000/counter', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`   // Pass the token in the Authorization header
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const counterElement = document.getElementById("counter-value"); // Update the counter display
    
            console.log(counterElement);

            if(counterElement){
                count = data.counter;       // Update the global count variable with the value from backend
                console.log("Count after loading from backend:", count); // Debug log
                counterElement.innerText = count;    // Update the counter display in the UI
            } else {
                console.error("Element with ID 'counter-value' not found.");
            }
    
        } else if (response.status === 403) {
            console.error("Forbidden: You are not authorized to access the counter.");
            alert("Session expired. Please log in again.");
            localStorage.removeItem('token');       //Clear invalid token
            window.location.href = 'index.html';
        } else {
            console.error("Failed to load counter.");
        }

    } catch (error) {
        console.error("Error loading counter: ". error);
    }

}

//Save counter to backend
async function saveCounter(counterValue) {
    const token = localStorage.getItem('token');    // Retrieve token from local storage or wherever it is stored

    const response = await fetch('http://localhost:3000/counter', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Pass the token in Authorization header 
        },
        body: JSON.stringify({ counter: counterValue})
    });
    
    if(response.status === 403){
        console.error("Forbidden: You are not authorized to update the counter.");
    } else if(response.ok) {
        console.log("Counter updated successfully");
    } else {
        console.error("Failed to update counter");
    }
}

//Function to increment counter in the UI and backend
document.getElementById('increment-btn').addEventListener('click', async function () {
    //Increment the counter in the UI
    console.log("Increment clicked. Current count:", count);
    count++;
    console.log("New count after increment:", count);
    updateCounterDisplay();     //Save the updated counter to the backend
    await saveCounter(count);  //Send to backend
});

//Function to decrement counter in th UI and the backend
document.getElementById('decrement-btn').addEventListener('click', async function () {
    if (count > 0) {
        console.log("Decrement clicked. Current count:", count);
        count--;
        console.log("New count after decrement:", count);
        updateCounterDisplay();     //Update UI
        await saveCounter(count);   // Save the updated count to the backend
    }
});

//Function to reset counter in th UI and the backend
document.getElementById('reset-btn').addEventListener('click', async function (){
    count = 0;
    updateCounterDisplay();
    await saveCounter(count);
});

//Function to update the counter display
function updateCounterDisplay(){
    document.getElementById('counter-value').innerHTML = count;
};

//Function for logout
document.getElementById('logout-btn').addEventListener('click', function () {
    localStorage.removeItem('token');   //Remove the stored token

    document.querySelector(".counter-section").style.display = "none";      // Optionally: clear any UI elements related to the user

    window.location.href = 'index.html';    //Redirect to login page     
});

// function saveCount(){
//     localStorage.setItem("count", count);   //store the count in localStorage
// }


//Call loadCounter() on page load to display the current counter
window.onload = async function(){
    const token = localStorage.getItem('token');    //Check if token exists

    if (!token) {
        if (window.location.pathname !== '/index.html') {
            console.log("Redirecting to login page, no token found.");
            window.location.href = 'index.html';        //No token, so redirect to login page
        }
    } else {
        // Ensure it waits for the counter to load
        console.time('Load Counter Time');
        await loadCounter();
        console.timeEnd('Load Counter Time');
    }
};