const express = require('express');
const validator = require('validator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Input validation function based on OWASP C5
function validateInput(input) {
    if (!input || typeof input !== 'string') {
        return { valid: false, reason: 'invalid' };
    }

    // XSS attack patterns
    const xssPatterns = [
        // eslint-disable-next-line security/detect-unsafe-regex
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<link/gi,
        /<meta/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi
    ];

    // SQL injection patterns
    const sqlPatterns = [
        /['";]|--|\/\*|\*\//gi,
        /(union|select|insert|delete|update|drop|create|alter|exec|execute)/gi,
        /(\bor\b|\band\b)\s+\w+\s*=\s*\w+/gi,
        /1\s*=\s*1/gi,
        /'\s*or\s*'/gi,
        /"\s*or\s*"/gi
    ];

    // Check for XSS attacks
    for (const pattern of xssPatterns) {
        if (pattern.test(input)) {
            return { valid: false, reason: 'xss' };
        }
    }

    // Check for SQL injection attacks
    for (const pattern of sqlPatterns) {
        if (pattern.test(input)) {
            return { valid: false, reason: 'sql' };
        }
    }

    // Additional validation: length and allowed characters
    if (input.length > 100) {
        return { valid: false, reason: 'too_long' };
    }

    // Only allow alphanumeric, spaces, and basic punctuation
    if (!/^[a-zA-Z0-9\s.,!?-]+$/.test(input)) {
        return { valid: false, reason: 'invalid_chars' };
    }

    return { valid: true, reason: null };
}

// Routes
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Secure Search</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                .form-container { background: #f5f5f5; padding: 30px; border-radius: 8px; }
                input[type="text"] { width: 70%; padding: 10px; margin: 10px 0; }
                button { padding: 10px 20px; background: #007cba; color: white; border: none; cursor: pointer; }
                button:hover { background: #005a87; }
                .error { color: red; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="form-container">
                <h1>Secure Search Application</h1>
                <form method="POST" action="/search">
                    <label for="searchTerm">Enter search term:</label><br>
                    <input type="text" id="searchTerm" name="searchTerm" required>
                    <button type="submit">Search</button>
                </form>
                ${req.query.error ? `<div class="error">Invalid input detected. Please enter a valid search term.</div>` : ''}
            </div>
        </body>
        </html>
    `);
});

app.post('/search', (req, res) => {
    const { searchTerm } = req.body;
    const validation = validateInput(searchTerm);

    if (!validation.valid) {
        // Clear input and redirect to home with error message
        return res.redirect('/?error=1');
    }

    // If validation passes, show search results
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Search Results</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                .results-container { background: #f0f8ff; padding: 30px; border-radius: 8px; }
                .search-term { background: #e7f3ff; padding: 15px; border-left: 4px solid #007cba; margin: 20px 0; }
                button { padding: 10px 20px; background: #dc3545; color: white; border: none; cursor: pointer; margin-top: 20px; }
                button:hover { background: #c82333; }
            </style>
        </head>
        <body>
            <div class="results-container">
                <h1>Search Results</h1>
                <div class="search-term">
                    <strong>Search Term:</strong> ${validator.escape(searchTerm)}
                </div>
                <p>Your search has been processed successfully.</p>
                <form action="/logout" method="POST">
                    <button type="submit">Logout & Return to Homepage</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/logout', (req, res) => {
    res.redirect('/');
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
