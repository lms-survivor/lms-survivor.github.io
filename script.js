// script.js

// Function to handle login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect form data
    const email = document.getElementById('email').value;
    const pin = document.getElementById('pin').value;

    // Create payload for Flow 1
    const payload = {
        email_address: email,
        pin: pin
    };

    // Send HTTP request to Flow 1
    fetch('https://your-flow-url-here.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.approved_status === 'approved') {
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
});

// Function to handle registration form submission
document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect form data
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('email').value;
    const reason = document.getElementById('reason').value;
    const entries = document.getElementById('entries').value;

    // Create payload for Flow 2
    const payload = {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        email_address: email,
        reason: reason,
        entries: entries
    };

    // Send HTTP request to Flow 2
    fetch('https://your-flow-url-here.com', {
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
        } else if (data.inquiry_status === 'existing') {
            window.location.href = 'existing.html';
        }
    })
    .catch(error => console.error('Error:', error));
});

// Function to handle pick updates in the Home Page
document.querySelectorAll('.edit-entry-btn').forEach(button => {
    button.addEventListener('click', function() {
        const entryId = this.getAttribute('data-entry-id');
        const entryData = JSON.parse(this.getAttribute('data-entry'));

        populateForm(entryData);
        document.getElementById('entryForm').classList.remove('hidden');
    });
});

function populateForm(entryData) {
    entryData.weeks.forEach((week, index) => {
        const weekSelect = document.getElementById(`week${week.week_no}`);
        weekSelect.value = week.selection;
        weekSelect.disabled = week.locked;
    });
}

document.getElementById('entryForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Collect form data
    const updatedData = collectFormData();

    // Send HTTP request to Flow 3
    fetch('https://your-flow-url-here.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
    .then(response => response.json())
    .then(data => {
        window.location.href = 'picksupdated.html';
    })
    .catch(error => console.error('Error:', error));
});

function collectFormData() {
    const weeks = [];

    for (let i = 1; i <= 18; i++) {
        const weekSelect = document.getElementById(`week${i}`);
        const selection = weekSelect.value;

        weeks.push({
            week_no: i,
            selection: selection,
            locked: weekSelect.disabled
        });
    }

    return {
        ...entryData,
        weeks: weeks
    };
}
