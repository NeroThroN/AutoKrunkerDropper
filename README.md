<h1 align="center">Auto Krunker Dropper</h1>
<p>Stop spending time watching streams for 4 hours, just to have ugly weapon skins: Automate it all !</p>
<p><img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/NeroThroN/AutoKrunkerDropper"> <img alt="GitHub" src="https://img.shields.io/github/repo-size/NeroThroN/AutoKrunkerDropper"> <img alt="GitHub issues" src="https://img.shields.io/github/issues/NeroThroN/AutoKrunkerDropper"></p>

## Features
- 🔐 Cookie-based login
- 📜 Auto accept cookie policy
- ⏳ Takes into account the progress of the different drops
- 🔁 Automatically choose the streamer with the most progress
- 🚩 Allow a list of streamers with a priority
- 🤐 Unmuted stream
- 🛠 Detect mature content-based stream and interact with it
- ❌ Ban streamers who already have a drop claimed
- 📽 Automatic lowest possible resolution settings

## Requirements
 - Windows or Linux OS
 - Network connection (Should be obvious...)
 - [Nodejs](https://nodejs.org/en/download/) and [NPM](https://www.npmjs.com/get-npm)
 
## Installation
### Windows
1. Login to your twitch account
2. Open inspector(F12 or Ctrl+Shift+I) on main site
3. Find the stored cookie section
4. Copy **auth-token**
5. Clone this repo
6. Install Chromium
7. Usually the path to the Chromium executable is: C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe
8. Install the dependencies with `npm install`
9. Start the program with `npm start` or `npm run start`
### Linux
1. Login to your twitch account
2. Open inspector(F12 or Ctrl+Shift+I) on main site
3. Find the stored cookie section
4. Copy **auth-token**
5. Clone this repo
6. Install Chromium: [TUTORIAL 🤗](https://www.addictivetips.com/ubuntu-linux-tips/install-chromium-on-linux/)
7. Locate Chromium executable: `whereis chromium` or `whereis chromium-browser`
8. Install the dependencies with `npm install`
9. Start the program with `npm start` or `npm run start`

## Debug
If you want to see what the program is doing, you can enable the browser with the command `npm run debug`

## Dependencies
<p><img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/NeroThroN/AutoKrunkerDropper/puppeteer-core"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/NeroThroN/AutoKrunkerDropper/cheerio"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/NeroThroN/AutoKrunkerDropper/inquirer"> <img alt="GitHub package.json dependency version (subfolder of monorepo)" src="https://img.shields.io/github/package-json/dependency-version/NeroThroN/AutoKrunkerDropper/dayjs"></p>

## Disclaimer
This code is for personnal purposes only.
Do not attempt to violate the law with anything contained here.
I will not be responsible for any illegal actions.
Reproduction and copy is authorised, provided the source is acknowledged.