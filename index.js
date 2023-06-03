#!/usr/bin/env node
const { browser: { createBrowser } } = require('mega-scraper')
const args = require('yargs').argv
async function translate ({ text, from = 'auto', to = 'en', browser, page } = {}) {
  if (!text) throw new Error('missing text')
  if (!from) throw new Error('missing from')
  if (!to) throw new Error('missing to')
  if (!browser) browser = await createBrowser({ headless: true, screenshot:true })

  page = page || await browser.newPage()
  await page.goto(`https://translate.google.com/#view=home&op=translate&sl=${from}&tl=${to}&text=${encodeURIComponent(text)}`)
  await page.waitForSelector('[jsaction="copy:zVnXqd,r8sht;"] > div > div span > div > div > div > div > span', { timeout: 10000 })

  const translation = await page.evaluate(() => document.querySelector('[jsaction="copy:zVnXqd,r8sht;"] > div > div span > div > div > div > div > span').textContent)
  await page.close()
  await browser.instance.close()

  return translation
}
module.exports = translate
