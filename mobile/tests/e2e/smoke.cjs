const {chromium,mockApi,login}=require('./fixtures.cjs');
const fs=require('fs');
(async()=>{const browser=await chromium.launch({channel:'msedge'});const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await mockApi(page);await login(page);await page.screenshot({path:'tests/dashboard-desktop.png',fullPage:true});console.log(await page.locator('body').innerText());console.log({errors});await browser.close()})().catch(e=>{console.error(e);process.exit(1)});

