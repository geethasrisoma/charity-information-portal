
const API_URL = "http://localhost:3000/api";

const charityList = document.getElementById("charity-list");
const charitySelect = document.getElementById("charity");
const donationForm = document.getElementById("donation-form");
const formMessage = document.getElementById("form-message");

let charities = [];

// Display a message
function showMessage(message, success = false) {
    formMessage.textContent = message;
    formMessage.style.color = success ? "#176b45" : "#b42318";
}

// Create an HTML element safely
function createElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}

// Load charities from the backend
async function loadCharities() {
    charityList.replaceChildren(
        createElement("p", "Loading charities...")
    );

    try {
        const response = await fetch(`${API_URL}/charities`);

        if (!response.ok) {
            throw new Error("Unable to load charities.");
        }

        charities = await response.json();

        charityList.replaceChildren();
        charitySelect.replaceChildren();

        charitySelect.add(
            new Option("Choose a charity", "")
        );

        if (charities.length === 0) {
            charityList.append(
                createElement("p", "No charities available yet.")
            );
            return;
        }

        charities.forEach((charity) => {
            const article = document.createElement("article");

            article.append(
                createElement("h3", charity.name),
                createElement("p", `Category: ${charity.category}`),
                createElement("p", `Location: ${charity.location}`),
                createElement("p", charity.description)
            );

            if (charity.contact_email) {
                article.append(
                    createElement(
                        "p",
                        `Contact: ${charity.contact_email}`
                    )
                );
            }

            const button = createElement(
                "button",
                "Support This Charity"
            );

            button.type = "button";
            button.addEventListener("click", () => {
                selectCharity(charity.id);
            });

            article.append(button);
            charityList.append(article);

            charitySelect.add(
                new Option(charity.name, String(charity.id))
            );
        });
    } catch (error) {
        console.error("Load charities error:", error);

        charityList.replaceChildren(
            createElement(
                "p",
                "Could not load charities. Check the backend server."
            )
        );
    }
}

// Select a charity and open the form
function selectCharity(charityId) {
    charitySelect.value = String(charityId);

    document.getElementById("donate").scrollIntoView({
        behavior: "smooth"
    });
}

// Submit donation interest to the backend
donationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage("");

    if (!donationForm.checkValidity()) {
        donationForm.reportValidity();
        return;
    }

    const donorName = document
        .getElementById("donor-name")
        .value.trim();

    const email = document
        .getElementById("email")
        .value.trim();

    const charityId = Number(charitySelect.value);

    const amountInput = document
        .getElementById("amount")
        .value;

    const message = document
        .getElementById("message")
        .value.trim();

    if (!donorName || !email || !charityId) {
        showMessage("Please fill in all required fields.");
        return;
    }

    if (
        amountInput !== "" &&
        (!Number.isFinite(Number(amountInput)) ||
            Number(amountInput) <= 0)
    ) {
        showMessage("Enter a valid donation amount.");
        return;
    }

    const requestData = {
        charity_id: charityId,
        donor_name: donorName,
        email: email,
        amount: amountInput === "" ? null : Number(amountInput),
        message: message || null
    };

    const submitButton = donationForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        const response = await fetch(
            `${API_URL}/donation-requests`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Submission failed."
            );
        }

        showMessage(
            "Thank you! Your donation interest was saved successfully.",
            true
        );

        donationForm.reset();
    } catch (error) {
        console.error("Submission error:", error);

        showMessage(
            error.message ||
            "Unable to submit. Please check your connection."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Interest";
    }
});

// Load database data when the page opens
loadCharities();
