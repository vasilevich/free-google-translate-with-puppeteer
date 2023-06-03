#!/usr/bin/env node
const {browser: {createBrowser}} = require('mega-scraper')
const args = require('yargs').argv

const placeholderMap = new Map();

function generateUniqueToken() {
    return Math.random().toString(10).substr(2, 10);
}

// Function to encode special parameters
function encodeSpecialParameters(input) {
    const specialParams = input.match(/&[a-zA-Z0-9#]+;/g);
    if(specialParams) {
        for(const param of specialParams) {
            let token = placeholderMap.get(param);
            if(!token) {
                token = generateUniqueToken();
                placeholderMap.set(token, param);
            }
            input = input.replace(new RegExp(param, 'g'), token);
        }
    }
    return input;
}

// Function to decode special parameters
function decodeSpecialParameters(input) {
    placeholderMap.forEach((value, key) => {
        input = input.replace(new RegExp(key, 'g'), value);
    });
    return input;
}

async function translate({text, from = 'auto', to = 'en', browser, page} = {}) {
    if (!text) throw new Error('missing text')
    if (!from) throw new Error('missing from')
    if (!to) throw new Error('missing to')
    if (!browser) browser = await createBrowser({headless: true, screenshot: false})

    page = page || await browser.newPage()
    await page.goto(`https://translate.google.com/?op=translate&sl=${from}&tl=${to}&text=${encodeURIComponent(encodeSpecialParameters(text))}`)
    await page.waitForSelector('[jsaction^="copy:"] div span[lang="ko"] span[jsaction^="click:"]', {timeout: 10000})

    const translation = await page.evaluate(() => [...document.querySelectorAll('[jsaction^="copy:"] div span[lang="ko"] span[jsaction^="click:"]')].map(e => e.textContent.trim()).filter(s => s !== 'Try again').join(' '))
    await page.close()
    await browser.instance.close()

    return decodeSpecialParameters(translation)
}

module.exports = translate
