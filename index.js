#!/usr/bin/env node
const {browser: {createBrowser}} = require('mega-scraper')
const args = require('yargs').argv

async function translate({text, from = 'auto', to = 'en', browser, page} = {}) {
    if (!text) throw new Error('missing text')
    if (!from) throw new Error('missing from')
    if (!to) throw new Error('missing to')
    if (!browser) browser = await createBrowser({headless: true, screenshot: true})

    page = page || await browser.newPage()
    await page.goto(`https://translate.google.com/?op=translate&sl=${from}&tl=${to}&text=${encodeURIComponent(text)}`)
    await page.waitForSelector('[jsaction^="copy:"] div span[lang="ko"] span[jsaction^="click:"]', {timeout: 10000})

    const translation = await page.evaluate(() => [...document.querySelectorAll('[jsaction^="copy:"] div span[lang="ko"] span[jsaction^="click:"]')].map(e => e.textContent.trim()).filter(s => s !== 'Try again').join(' '))
    await page.close()
    await browser.instance.close()

    return translation
}

module.exports = translate
