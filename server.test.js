const request = require('supertest');
const app = require('./server');

describe('Secure Search App', () => {
    test('GET / should return home page', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.text).toContain('Secure Search Application');
    });

    test('POST /search with valid input should show results', async () => {
        const response = await request(app)
            .post('/search')
            .send({ searchTerm: 'valid search term' });
        expect(response.status).toBe(200);
        expect(response.text).toContain('Search Results');
        expect(response.text).toContain('valid search term');
    });

    test('POST /search with XSS attempt should redirect to home', async () => {
        const response = await request(app)
            .post('/search')
            .send({ searchTerm: '<script>alert("xss")</script>' });
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/?error=1');
    });

    test('POST /search with SQL injection attempt should redirect to home', async () => {
        const response = await request(app)
            .post('/search')
            .send({ searchTerm: "'; DROP TABLE users; --" });
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/?error=1');
    });

    test('POST /logout should redirect to home', async () => {
        const response = await request(app).post('/logout');
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/');
    });

    test('GET /health should return health status', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('OK');
    });
});
