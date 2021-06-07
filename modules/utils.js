import { readFileSync, existsSync, writeFile } from 'fs';
import puppeteer from "puppeteer-core"
import { load } from "cheerio"
import { askLogin } from "./input.js"
import * as Querys from './querys.js';

async function setResolution(page) {
  console.log('🔧 Setting lowest possible resolution..');

  await clickWhenExist(page, Querys.streamSettingsQuery);
  await page.waitFor(Querys.streamQualitySettingQuery);

  await clickWhenExist(page, Querys.streamQualitySettingQuery);
  await page.waitFor(Querys.streamQualityQuery);

  var resolution = await queryOnWebsite(page, Querys.streamQualityQuery);
  resolution = resolution[resolution.length - 1].attribs.id;
  await page.evaluate((resolution) => { document.getElementById(resolution).click();}, resolution);

  await page.keyboard.press('m');
}

async function ReadConfigFile(configPath) {
  const showBrowser = (process.argv.length > 2 && process.argv[2] == "browser")
  
  var browserConfig = {
    headless: !showBrowser,
    args: [
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  };

  const cookie = [{
    "domain": ".twitch.tv",
    "hostOnly": false,
    "httpOnly": false,
    "name": "auth-token",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "id": 1
  }];
  try {
    console.log('🔎 Checking config file...');
    if (existsSync(configPath)) {
      console.log('✅ Json config found!');
      let configFile = JSON.parse(readFileSync(configPath, 'utf8'))

      browserConfig.executablePath = configFile.exec;
      cookie[0].value = configFile.token;
      return { cookie, browserConfig };
    } else {
      console.log('❌ No config file found!');

      let input = await askLogin();
      input.banStreamers = new Array()
      writeFile(configPath, JSON.stringify(input), function(err) { if (err) console.log(err); });

      browserConfig.executablePath = input.exec;
      cookie[0].value = input.token;
      return { cookie, browserConfig };
    }
  } catch (err) {
    console.log('🤬 Error: ', err);
    console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
  }
}

async function clickWhenExist(page, query) {
  let result = await queryOnWebsite(page, query);

  try {
    if (result[0].type == 'tag' && result[0].name == 'button') {
      await page.click(query);
      await page.waitFor(500);
      return;
    }
  } catch (e) {}
}

async function checkLogin(page) {
  let cookieSetByServer = await page.cookies();
  for (var i = 0; i < cookieSetByServer.length; i++) {
    if (cookieSetByServer[i].name == 'twilight-user') {
      console.log('✅ Login successful!');
      return true;
    }
  }
  console.log('🛑 Login failed!');
  console.log('🔑 Invalid token!');
  console.log('\nPleas ensure that you have a valid twitch auth-token.\nhttps://github.com/D3vl0per/Valorant-watcher#how-token-does-it-look-like');
  process.exit();
}

async function spawnBrowser(browserConfig, cookie) {
  console.log("=========================");
  console.log('📱 Launching browser...');
  var browser = await puppeteer.launch(browserConfig);
  var page = await browser.newPage();

  console.log('🔧 Setting auth token...');
  await page.setCookie(...cookie); //Set cookie

  console.log('⏰ Setting timeouts...');
  await page.setDefaultNavigationTimeout(process.env.timeout || 0);
  await page.setDefaultTimeout(process.env.timeout || 0);

  return {
    browser,
    page
  };
}

async function scroll(page, times) {
  for (var i = 0; i < times; i++) {
    await page.evaluate(async (page) => {
      var x = document.getElementsByClassName("scrollable-trigger__wrapper");
      if (x.length > 0) { // there will be no scroll if there are no active streams
        x[0].scrollIntoView();
      }
    });
    await page.waitFor(500);
  }
  return;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function queryOnWebsite(page, query) {
  let bodyHTML = await page.evaluate(() => document.body.innerHTML);
  let $ = load(bodyHTML);
  const jquery = $(query);
  return jquery;
}

async function queryOnElement(element, query) {
  let $ = load(element);
  const jquery = $(query);
  return jquery;
}

async function shutDown() {
  console.log("\n👋Bye Bye👋");
  run = false;
  process.exit();
}
 
export { setResolution, clickWhenExist, ReadConfigFile, checkLogin, scroll, spawnBrowser, getRandomInt, queryOnWebsite, queryOnElement, shutDown }