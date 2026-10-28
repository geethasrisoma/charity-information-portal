
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const supabase = require("./supabase");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20kb" }));

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Charity Information Portal API is running"
    });
});

// Get all charities
app.get("/api/charities", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("charities")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error("Get charities error:", error.message);
        res.status(500).json({
            error: "Unable to fetch charities"
        });
    }
});

// Get one charity
app.get("/api/charities/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid charity ID"
            });
        }

        const { data, error } = await supabase
            .from("charities")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                error: "Charity not found"
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Get charity error:", error.message);
        res.status(500).json({
            error: "Unable to fetch charity"
        });
    }
});

// Add a charity
app.post("/api/charities", async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            location,
            contact_email
        } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            typeof category !== "string" ||
            !category.trim() ||
            typeof location !== "string" ||
            !location.trim()
        ) {
            return res.status(400).json({
                error: "Name, description, category and location are required"
            });
        }

        if (
            contact_email != null &&
            contact_email !== "" &&
            (
                typeof contact_email !== "string" ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)
            )
        ) {
            return res.status(400).json({
                error: "Invalid contact email"
            });
        }

        const { data, error } = await supabase
            .from("charities")
            .insert([{
                name: name.trim(),
                description: description.trim(),
                category: category.trim(),
                location: location.trim(),
                contact_email: contact_email
                    ? contact_email.trim()
                    : null
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error("Add charity error:", error.message);
        res.status(500).json({
            error: "Unable to add charity"
        });
    }
});

// Update a charity
app.put("/api/charities/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid charity ID"
            });
        }

        const allowedFields = [
            "name",
            "description",
            "category",
            "location",
            "contact_email"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (Object.hasOwn(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: "No valid fields provided"
            });
        }

        for (const field of [
            "name",
            "description",
            "category",
            "location"
        ]) {
            if (
                Object.hasOwn(updates, field) &&
                (
                    typeof updates[field] !== "string" ||
                    !updates[field].trim()
                )
            ) {
                return res.status(400).json({
                    error: `${field} must not be empty`
                });
            }

            if (typeof updates[field] === "string") {
                updates[field] = updates[field].trim();
            }
        }

        if (
            Object.hasOwn(updates, "contact_email") &&
            updates.contact_email !== null &&
            updates.contact_email !== ""
        ) {
            if (
                typeof updates.contact_email !== "string" ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    updates.contact_email
                )
            ) {
                return res.status(400).json({
                    error: "Invalid contact email"
                });
            }

            updates.contact_email = updates.contact_email.trim();
        }

        if (updates.contact_email === "") {
            updates.contact_email = null;
        }

        const { data, error } = await supabase
            .from("charities")
            .update(updates)
            .eq("id", id)
            .select()
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                error: "Charity not found"
            });
        }

        res.json(data);
    } catch (error) {
        console.error("Update charity error:", error.message);
        res.status(500).json({
            error: "Unable to update charity"
        });
    }
});

// Delete a charity
app.delete("/api/charities/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "Invalid charity ID"
            });
        }

        const { data, error } = await supabase
            .from("charities")
            .delete()
            .eq("id", id)
            .select("id")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                error: "Charity not found"
            });
        }

        res.json({
            message: "Charity deleted successfully"
        });
    } catch (error) {
        console.error("Delete charity error:", error.message);
        res.status(500).json({
            error: "Unable to delete charity"
        });
    }
});

// Submit donation interest
app.post("/api/donation-requests", async (req, res) => {
    try {
        const {
            charity_id,
            donor_name,
            email,
            amount,
            message
        } = req.body;

        if (
            !Number.isSafeInteger(Number(charity_id)) ||
            Number(charity_id) <= 0 ||
            typeof donor_name !== "string" ||
            !donor_name.trim() ||
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                error: "Valid charity ID, donor name and email are required"
            });
        }

        let validAmount = null;

        if (amount !== undefined && amount !== null && amount !== "") {
            validAmount = Number(amount);

            if (
                !Number.isFinite(validAmount) ||
                validAmount <= 0 ||
                !Number.isSafeInteger(
                    Math.round(validAmount * 100)
                )
            ) {
                return res.status(400).json({
                    error: "Donation amount must be greater than zero"
                });
            }
        }

        if (
            message != null &&
            typeof message !== "string"
        ) {
            return res.status(400).json({
                error: "Message must be text"
            });
        }

        const { data, error } = await supabase
            .from("donation_requests")
            .insert([{
                charity_id: Number(charity_id),
                donor_name: donor_name.trim(),
                email: email.trim(),
                amount: validAmount,
                message: message ? message.trim() : null
            }])
            .select("id, charity_id, donor_name, status, created_at")
            .single();

        if (error) throw error;

        res.status(201).json({
            message: "Donation interest submitted successfully",
            request: data
        });
    } catch (error) {
        console.error("Donation request error:", error.message);
        res.status(500).json({
            error: "Unable to submit donation interest"
        });
    }
});

// List donation requests
app.get("/api/donation-requests", async (req, res) => {
    res.status(403).json({
        error: "Admin authentication is required for this operation"
    });
});

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        error: "API endpoint not found"
    });
});

// General error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    res.status(500).json({
        error: "Internal server error"
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
