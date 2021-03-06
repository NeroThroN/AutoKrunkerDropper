// ========================================== CONFIG SECTION =================================================================
const configPath = './config.json'
const startUrl = 'https://www.twitch.tv/settings/profile' // Just an url inside twitch but with fast opening speed
const baseUrl = 'https://www.twitch.tv/';
const streamersUrl = 'https://www.twitch.tv/directory/game/Krunker?tl=c2542d6d-cd10-4532-919b-3d19f30a768b';

const minWatching = 10;
const maxWatching = 15;
const NoOneTime = 30;
// ========================================== CONFIG SECTION =================================================================

import dayjs from 'dayjs';
import { readFileSync, writeFileSync } from 'fs';
import { Streamers, Streamer } from './modules/streamer.js';
import * as Querys from './modules/querys.js';
import * as Utils from './modules/utils.js';

async function viewStreamer(page, streamersPriority, streamers, firstRun) {
  if (!streamersPriority.length && !streamers.length) {
    console.log(`\nā No streamer available (Rescan in ${NoOneTime} minutes | ${dayjs().add(NoOneTime, 'minutes').format('HH:mm:ss')})\n`)
    return await page.waitFor(NoOneTime * 60000);;
  }

  const streamer = streamersPriority.length ? streamersPriority[0] : streamers[0]
  var sleep = Utils.getRandomInt(minWatching, maxWatching) * 60000;

  console.log(`\nš Now watching streamer: ${baseUrl + streamer.name} (${streamer.progress} %)`);
  await page.goto(baseUrl + streamer.name, { "waitUntil": "networkidle2" });

  await Utils.clickWhenExist(page, Querys.cookiePolicyQuery);
  await Utils.clickWhenExist(page, Querys.matureContentQuery);
  console.log('ā Cookies & Mature content checked !') 

  if (firstRun) Utils.setResolution(page)

  console.log(
    'š Start: ' + dayjs().format('HH:mm:ss') +
    ' - End: ' + dayjs().add(sleep, 'millisecond').format('HH:mm:ss') +
    ' | duration: ' + sleep / 60000 + ' minutes\n'
  );
  await page.waitFor(sleep);

  return false
}

async function getAllStreamer(page) {
  console.log("=========================");
  const streamers = new Streamers();
  await getDropsTime(page, streamers);

  await page.goto(streamersUrl, { "waitUntil": "networkidle0" });
  console.log('š” Checking active streamers...');
  await Utils.scroll(page, 2);
  const jquery = await Utils.queryOnWebsite(page, Querys.channelsQuery);

  // Merging active streamers
  for (var i = 0; i < jquery.length; i++) {
    streamers.setActive(jquery[i].attribs.href.split("/")[1])
  }

  let configFile = JSON.parse(readFileSync(configPath, 'utf8'))

  // Merging ban streamers
  const diff = streamers.banNames().filter(streamer => !configFile.banStreamers.includes(streamer))
  if (diff.length) {
    console.log('ā Ban dropped streamer...');
    configFile.banStreamers.push(...diff)
    writeFileSync(configPath, JSON.stringify(configFile))
  }
  streamers.setBan(configFile.banStreamers)

  // Merging priority streamers
  streamers.setPriority(configFile.priority || new Array())

  // Show streamers
  console.log("=========================\nš§ Active streamers to watch:");
  streamers.show()
  console.log("=========================");
  return streamers;
}

async function getDropsTime(page, streamers) {
  console.log('ā Get Drop time...');
  await page.goto('https://www.twitch.tv/drops/inventory', { "waitUntil": "networkidle0" });  
  await Utils.scroll(page, 2);
  const jquery = await Utils.queryOnWebsite(page, Querys.dropsQuery);

  // Process all drops
  for (var i = 1; i < jquery.length; i++) {
    const nameElement = await Utils.queryOnElement(jquery[i], Querys.dropNameQuery)
    const name = (nameElement.contents().first().text()).substring(1)

    const timeElement = await Utils.queryOnElement(jquery[i], Querys.dropTimeQuery)
    const time = timeElement[0].attribs.value

    streamers.add(new Streamer(name, Number(time), false, time == 100))
  }
}

async function main() {
  console.clear();
  console.log("=========================");
  const { cookie, browserConfig } = await Utils.ReadConfigFile(configPath);
  var { page } = await Utils.spawnBrowser(browserConfig, cookie);
  console.log("=========================");
  await page.goto(startUrl, { "waitUntil": "networkidle0" });
  console.log('š Checking login...');
  await Utils.checkLogin(page);
  console.log('š­ Running watcher...');

  var run = true, firstRun = true;
  while (run) {
    try {
      const streamers = await getAllStreamer(page);
      firstRun = await viewStreamer(page, streamers.toWatchPriority(), streamers.toWatch(), firstRun);
    } catch (e) { console.log('š¤¬ Error: ', e) }
  }
};

main();

process.on("SIGINT", Utils.shutDown);
process.on("SIGTERM", Utils.shutDown);
