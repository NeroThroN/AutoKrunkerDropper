const puppeteer = require('puppeteer-core');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
var fs = require('fs');
const inquirer = require('./input');

// ========================================== CONFIG SECTION =================================================================

const configPath = './config.json'
const startUrl = 'https://www.twitch.tv/settings/profile' // Just an url inside twitch but with fast opening speed
const baseUrl = 'https://www.twitch.tv/';
const streamersUrl = 'https://www.twitch.tv/directory/game/Krunker?tl=c2542d6d-cd10-4532-919b-3d19f30a768b';

const minWatching = 10;
const maxWatching = 15;
const NoOneTime = 30;

// ========================================== CONFIG SECTION =================================================================

var run = true;
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

const cookiePolicyQuery = 'button[data-a-target="consent-banner-accept"]';
const matureContentQuery = 'button[data-a-target="player-overlay-mature-accept"]';
const channelsQuery = 'a[data-test-selector*="ChannelLink"]';
const dropsQuery = 'div[data-test-selector="DropsCampaignsInProgressPresentation-main-layout"] > div';
const dropNameQuery = 'a[data-test-selector="DropsCampaignInProgressDescription-single-channel-hint-text"]'
const dropTimeQuery = 'div[data-a-target="tw-progress-bar-animation"]'
const streamSettingsQuery = '[data-a-target="player-settings-button"]';
const streamQualitySettingQuery = '[data-a-target="player-settings-menu-item-quality"]';
const streamQualityQuery = 'input[data-a-target="tw-radio"]';

async function viewStreamer(page, streamers, firstRun) {
  streamers.sort((streamerA, streamerB) => streamerB.progress - streamerA.progress)
  streamersToWatch = streamers.filter(streamer => !streamer.ban && streamer.active)

  if (!streamersToWatch.length) {
    console.log('\n❔ No streamer available (Rescan in ' + NoOneTime + ' minutes | ' + dayjs().add(NoOneTime, 'minutes').format('HH:mm:ss') + ')\n')
    return await page.waitFor(NoOneTime * 60000);;
  }

  let streamer = streamersToWatch[0].streamer
  var sleep = getRandomInt(minWatching, maxWatching) * 60000;

  console.log('\n👀 Now watching streamer: ', baseUrl + streamer);
  await page.goto(baseUrl + streamer, { "waitUntil": "networkidle2" });

  await clickWhenExist(page, cookiePolicyQuery);
  await clickWhenExist(page, matureContentQuery);
  console.log('✅ Cookies & Mature content checked !') 

  if (firstRun) {
    setResolution(page)
    firstRun = false;
  }

  console.log(
    '🕒 Start: ' + dayjs().format('HH:mm:ss') +
    ' - End: ' + dayjs().add(sleep, 'millisecond').format('HH:mm:ss') +
    ' | duration: ' + sleep / 60000 + ' minutes\n'
  );
  await page.waitFor(sleep);
}

async function setResolution(page) {
  console.log('🔧 Setting lowest possible resolution..');

  await clickWhenExist(page, streamSettingsQuery);
  await page.waitFor(streamQualitySettingQuery);

  await clickWhenExist(page, streamQualitySettingQuery);
  await page.waitFor(streamQualityQuery);

  var resolution = await queryOnWebsite(page, streamQualityQuery);
  resolution = resolution[resolution.length - 1].attribs.id;
  await page.evaluate((resolution) => { document.getElementById(resolution).click();}, resolution);

  await page.keyboard.press('m');
}

async function readLoginData() {
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
    if (fs.existsSync(configPath)) {
      console.log('✅ Json config found!');
      let configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'))

      browserConfig.executablePath = configFile.exec;
      cookie[0].value = configFile.token;
      return cookie;
    } else {
      console.log('❌ No config file found!');

      let input = await inquirer.askLogin();
      fs.writeFile(configPath, JSON.stringify(input), function(err) { if (err) console.log(err); });

      browserConfig.executablePath = input.exec;
      cookie[0].value = input.token;
      return cookie;
    }
  } catch (err) {
    console.log('🤬 Error: ', e);
    console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
  }
}

async function spawnBrowser(cookie) {
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

async function getAllStreamer(page) {
  console.log("=========================");
  const streamers = new Array();
  await getDropsTime(page, streamers);

  await page.goto(streamersUrl, { "waitUntil": "networkidle0" });
  console.log('📡 Checking active streamers...');
  await scroll(page, 2);
  const jquery = await queryOnWebsite(page, channelsQuery);

  // Merging active streamers
  for (var i = 0; i < jquery.length; i++) {
    const active = jquery[i].attribs.href.split("/")[1]
    if (streamers.map(streamer => streamer.streamer).includes(active)) {
      streamers.forEach((streamer) => streamer.active = active == streamer.streamer)
    } else {
      streamers.push({"streamer":active, "progress": 0, "active": true, "ban": false})
    }
  }

  // Merging ban streamers
  let configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'))

  const banned = streamers.filter(streamer => streamer.ban).map(streamer => streamer.streamer)
  diff = banned.filter(streamer => !configFile.banStreamers.includes(streamer))
  if (diff.length) {
    console.log('❌ Ban dropped streamer...');
    configFile.banStreamers.push(...diff);
    fs.writeFileSync(configPath, JSON.stringify(configFile))
  }
  streamers.forEach((streamer) => streamer.ban = configFile.banStreamers.includes(streamer.streamer))

  // Show streamers
  if (streamers.filter(streamer => !streamer.ban && streamer.active).length > 0) {
    console.log("=========================\n🎧 Streamers to watch:");
    streamers.filter(streamer => !streamer.ban && streamer.active).forEach(streamer => console.log(" - " + streamer.streamer + ' (' + streamer.progress + ' %)'))
    console.log("=========================");
  }
  return streamers;
}

async function getDropsTime(page, streamers) {
  console.log('⌚ Get Drop time...');
  await page.goto('https://www.twitch.tv/drops/inventory', { "waitUntil": "networkidle0" });  
  await scroll(page, 2);
  const jquery = await queryOnWebsite(page, dropsQuery);

  // Process all drops
  for (var i = 1; i < jquery.length; i++) {
    const nameElement = await queryOnElement(jquery[i], dropNameQuery)
    const name = (nameElement.contents().first().text()).substring(1)

    const timeElement = await queryOnElement(jquery[i], dropTimeQuery)
    const time = timeElement[0].attribs.value

    streamers.push({"streamer":name, "progress": Number(time), "active": false, "ban": time == 100})
  }
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

async function queryOnWebsite(page, query) {
  let bodyHTML = await page.evaluate(() => document.body.innerHTML);
  let $ = cheerio.load(bodyHTML);
  const jquery = $(query);
  return jquery;
}

async function queryOnElement(element, query) {
  let $ = cheerio.load(element);
  const jquery = $(query);
  return jquery;
}

async function shutDown() {
  console.log("\n👋Bye Bye👋");
  run = false;
  process.exit();
}

async function main() {
  console.clear();
  console.log("=========================");
  const cookie = await readLoginData();
  var { page } = await spawnBrowser(cookie);
  console.log("=========================");
  await page.goto(startUrl, { "waitUntil": "networkidle0" });
  console.log('🔐 Checking login...');
  await checkLogin(page);
  console.log('🔭 Running watcher...');

  var firstRun = true;
  while (run) {
    try {
      const streamers = await getAllStreamer(page);
      await viewStreamer(page, streamers, firstRun);
    } catch (e) { console.log('🤬 Error: ', e) }
  }
};

main();

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
