const { Builder, By, until } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');

async function runUITests() {
    let driver;
    
    try {
        // Setup Chrome options for headless testing
        const options = new Options();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        
        // Connect to Selenium Grid or local Chrome
        driver = await new Builder()
            .forBrowser('chrome')
            .usingServer('http://localhost:4444/wd/hub')
            .setChromeOptions(options)
            .build();

        // Test 1: Homepage loads correctly
        console.log('Test 1: Loading homepage...');
        await driver.get('http://localhost:3000');
        const title = await driver.getTitle();
        console.log(`Page title: ${title}`);
        
        const searchInput = await driver.findElement(By.id('searchTerm'));
        const submitButton = await driver.findElement(By.css('button[type="submit"]'));
        
        if (searchInput && submitButton) {
            console.log('✓ Homepage loaded with search form');
        }

        // Test 2: Valid search submission
        console.log('Test 2: Testing valid search...');
        await searchInput.clear();
        await searchInput.sendKeys('valid search term');
        await submitButton.click();
        
        await driver.wait(until.titleContains('Search Results'), 5000);
        const resultsPage = await driver.findElement(By.css('h1'));
        const resultsText = await resultsPage.getText();
        
        if (resultsText.includes('Search Results')) {
            console.log('✓ Valid search redirected to results page');
        }

        // Test 3: Logout functionality
        console.log('Test 3: Testing logout...');
        const logoutButton = await driver.findElement(By.css('button[type="submit"]'));
        await logoutButton.click();
        
        await driver.wait(until.titleContains('Secure Search'), 5000);
        const homeTitle = await driver.getTitle();
        
        if (homeTitle.includes('Secure Search')) {
            console.log('✓ Logout redirected to homepage');
        }

        // Test 4: XSS attack prevention
        console.log('Test 4: Testing XSS prevention...');
        const searchInput2 = await driver.findElement(By.id('searchTerm'));
        const submitButton2 = await driver.findElement(By.css('button[type="submit"]'));
        
        await searchInput2.clear();
        await searchInput2.sendKeys('<script>alert("xss")</script>');
        await submitButton2.click();
        
        // Should redirect back to homepage with error
        await driver.wait(until.urlContains('error=1'), 5000);
        const currentUrl = await driver.getCurrentUrl();
        
        if (currentUrl.includes('error=1')) {
            console.log('✓ XSS attack prevented and redirected to homepage');
        }

        console.log('\n🎉 All UI tests passed successfully!');
        
    } catch (error) {
        console.error('UI Test failed:', error.message);
        process.exit(1);
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

runUITests();
