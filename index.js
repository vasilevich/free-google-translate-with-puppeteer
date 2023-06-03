#!/usr/bin/env node
const {browser: {createBrowser}} = require('mega-scraper')
const args = require('yargs').argv

const encodeMap = new Map();
const decodeMap = new Map();

function encodeSpecialParameters(input) {
    const specialParams = input.match(/&[a-zA-Z0-9#]+;/g);
    if(specialParams) {
        for(const param of specialParams) {
            const encoded = Buffer.from(param).toString('base64');
            const wrappedEncoded = `&nbsp;${encoded}&nbsp;`;
            input = input.replace(new RegExp(param, 'g'), wrappedEncoded);
            encodeMap.set(param, wrappedEncoded);
            decodeMap.set(wrappedEncoded, param);
        }
    }
    return input;
}

// Function to decode special parameters
function decodeSpecialParameters(input) {
    const specialParams = input.match(/&nbsp;[a-zA-Z0-9+/=]+&nbsp;/g);
    if(specialParams) {
        for(const param of specialParams) {
            const original = decodeMap.get(param);
            if(original) {
                input = input.replace(new RegExp(param, 'g'), original);
            }
        }
    }
    return input;
}

async function translate({text, from = 'auto', to = 'en', browser, page} = {}) {
    if (!text) throw new Error('missing text')
    if (!from) throw new Error('missing from')
    if (!to) throw new Error('missing to')
    if (!browser) browser = await createBrowser({headless: true, screenshot: true})

    page = page || await browser.newPage()
    await page.goto(`https://translate.google.com/?op=translate&sl=${from}&tl=${to}&text=${encodeURIComponent(encodeSpecialParameters(text))}`)
    await page.waitForSelector('[jsaction^="copy:"] div span[lang="ko"] span[jsaction^="click:"]', {timeout: 10000})

    const translation = await page.evaluate(() => [...document.querySelectorAll('[jsaction^="copy:"] div span[lang="ko"] span[jsaction^="click:"]')].map(e => e.textContent.trim()).filter(s => s !== 'Try again').join(' '))
    await page.close()
    await browser.instance.close()

    return decodeSpecialParameters(translation)
}

module.exports = translate
