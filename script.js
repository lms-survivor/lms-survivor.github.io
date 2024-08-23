// script.js

// Function to handle login form submission
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const pin = document.getElementById('pin').value;

    // JSON payload for Flow 1
    const payload = {
        "email": email,
        "pin": pin
    };

    // Replace with your actual Flow 1 URL
    const url = "https://YOUR_FLOW_1_URL_HERE";

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        sessionStorage.setItem('email', data.email);
        sessionStorage.setItem('first_name', data.first_name);
        sessionStorage.setItem('last_name', data.last_name);
        sessionStorage.setItem('phone', data.phone);
        sessionStorage.setItem('pool_entries', JSON.stringify(data.pool_entries));
        sessionStorage.setItem('team_options', JSON.stringify(data.team_options));

        if (data.approved_status === 'approved') {
            sessionStorage.setItem('approved', 'true');
            window.location.href = 'home.html';
        } else if (data.approved_status === 'pending') {
            window.location.href = 'pending.html';
        } else if (data.approved_status === 'rejected') {
            window.location.href = 'rejected.html';
        } else {
            window.location.href = 'invalid.html';
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle registration form submission
function handleRegistration(event) {
    event.preventDefault();

    const firstName = document.getElementById('first_name').value;
    const lastName = document.getElementById('last_name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const reason = document.getElementById('reason').value;
    const entries = document.getElementById('entries').value;

    // JSON payload for Flow 2
    const payload = {
        "first_name": firstName,
        "last_name": lastName,
        "phone": phone,
        "email": email,
        "reason": reason,
        "entries": entries
    };

    // Replace with your actual Flow 2 URL
    const url = "https://YOUR_FLOW_2_URL_HERE";

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.inquiry_status === 'submitted') {
            window.location.href = 'registration.html';
        } else if (data.inquiry_status === 'pending') {
            window.location.href = 'pending.html';
        } else {
            window.location.href = 'existing.html';
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle pick management (Form 3)
function handlePicksSubmission(event, entryId) {
    event.preventDefault();

    // Collect data from the form fields for each week
    let weeks = [];
    for (let i = 1; i <= 18; i++) {
        let selection = document.getElementById(`week${i}`).value;
        weeks.push({ "week_no": i, "selection": selection });
    }

    let poolEntries = JSON.parse(sessionStorage.getItem('pool_entries'));

    // Find the specific entry by entryId and update its weeks
    for (let entry of poolEntries) {
        if (entry.dvuid === entryId) {
            entry.weeks = weeks;
        }
    }

    // JSON payload for Flow 3
    const payload = {
        "email": sessionStorage.getItem('email'),
        "first_name": sessionStorage.getItem('first_name'),
        "last_name": sessionStorage.getItem('last_name'),
        "phone": sessionStorage.getItem('phone'),
        "pool_entries": poolEntries,
        "team_options": JSON.parse(sessionStorage.getItem('team_options'))
    };

    // Replace with your actual Flow 3 URL
    const url = "https://YOUR_FLOW_3_URL_HERE";

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        sessionStorage.setItem('pool_entries', JSON.stringify(data.pool_entries));
        window.location.href = 'picksupdated.html';
    })
    .catch(error => console.error('Error:', error));
}

// Function to handle rejected inquiry submission (Form 4)
function handleRejectedInquiry(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // JSON payload for Flow 4
    const payload = {
        "email": email,
        "message": message
    };

    // Replace with your actual Flow 4 URL
    const url = "https://YOUR_FLOW_4_URL_HERE";

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        alert("Thank you for reaching out. We will contact you shortly.");
    })
    .catch(error => console.error('Error:', error));
}

// Basic client-side access control
function checkAccess() {
    if (!sessionStorage.getItem('approved') && window.location.pathname === '/home.html') {
        window.location.href = 'invalid.html';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname === '/index.html') {
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }
    if (window.location.pathname === '/inquiry.html') {
        document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
    }
    if (window.location.pathname === '/rejected.html') {
        document.getElementById('rejectedForm').addEventListener('submit', handleRejectedInquiry);
    }
    if (window.location.pathname === '/home.html') {
        checkAccess();
    }
});
