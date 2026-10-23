const web = process.env.CIVICTRACK_WEB_URL || 'http://localhost:8081';
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const image = fs.readFileSync(path.join(__dirname, '../../assets/icon.png'));
const user = { _id: '64a000000000000000000001', name: 'Asha Patel', email: 'citizen.qa@example.test', role: 'citizen', phone: '1234567890' };
const complaints = [0,1,2,3,4,5].map((n) => ({ _id: `64b00000000000000000000${n}`, complaintId: `CIV-10010${n}`, title: ['Pothole near station','Waste collection needed','Road surface cracked'][n%3], description: ['Pothole near the pedestrian crossing. Please repair the damaged surface.','Uncollected waste is blocking the footpath.','Cracked road surface near the bus stop.'][n%3], category: ['pothole','garbage','road_damage'][n%3], address: 'Station Road, Central neighborhood', imageUrl: `${web}/qa-image.png`, status: ['Pending','In Progress','Resolved'][n%3], priority: n===0?'high':'medium', createdAt: new Date(Date.now() - (n===5?70:n)*86400000).toISOString(), updatedAt: new Date().toISOString(), resolvedAt: n%3===2 ? new Date().toISOString() : null, createdBy: user, aiConfidence: .91, boundingBoxes: [], latitude: 12.97, longitude: 77.59, verified: false }));
async function mockApi(page, role='citizen', options={}) {
 const account = {...user, role, name: role==='citizen'?'Asha Patel':'Officer Asha Patel'};
 const state={ complaints: structuredClone(complaints), requests:[], fail:false, ...options };
 await page.route('**/qa-image.png', r=>r.fulfill({contentType:'image/png',body:image}));
 await page.route('**/api/**', async r=>{
  const url=new URL(r.request().url()); const p=url.pathname; const method=r.request().method(); state.requests.push({p,method});
  let data=null; let status=200;
  if(p.endsWith('/auth/login')||p.endsWith('/auth/register')) data={user:account,token:'isolated-browser-fixture'};
  else if(p.endsWith('/auth/me')) data=account;
  else if(p.endsWith('/auth/profile')) data={...account,...r.request().postDataJSON()};
  else if(p.endsWith('/auth/change-password')||p.endsWith('/auth/logout')) data=null;
  else if(p.endsWith('/uploads/image')) data={imageUrl:`${web}/qa-image.png`};
  else if(p.endsWith('/ai/detect')) data={detected:true,detections:[{category:'pothole',confidence:.91,bbox:{x1:10,y1:10,x2:100,y2:100},model:'fixture'}]};
  else if(p==='/api/complaints'&&method==='POST') { data={...r.request().postDataJSON(),_id:'64b000000000000000000099',complaintId:'CIV-100199',status:'Pending',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; state.complaints.unshift(data); }
  else if(p.endsWith('/my')||p==='/api/authority/complaints') {
   if(state.fail) return r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Reports temporarily unavailable'})});
   data={complaints:state.complaints,stats:{total:state.complaints.length,pending:state.complaints.filter(c=>c.status==='Pending').length,inProgress:state.complaints.filter(c=>c.status==='In Progress').length,resolved:state.complaints.filter(c=>c.status==='Resolved').length,highPriority:1,today:1}};
  } else if(p.includes('/complaints/')) {const id=p.split('/complaints/')[1].split('/')[0]; data=state.complaints.find(c=>c._id===id); if(method==='PATCH'&&data) Object.assign(data,p.endsWith('/verify')?{verified:true}:r.request().postDataJSON()); if(method==='DELETE')state.complaints=state.complaints.filter(c=>c._id!==id);if(!data)status=404;}
  else return r.fulfill({status:404,body:JSON.stringify({message:'Unmocked route '+p})});
  await r.fulfill({status,contentType:'application/json',body:JSON.stringify({success:status===200,data,message:status===200?'OK':'Not found'})});
 }); return state;
}
async function login(page,role='citizen') {
 await page.goto(`${web}/${role==='citizen'?'citizen-login':'authority-login'}`);
 await page.getByLabel(role==='citizen'?'Email Address':'Department Official Email',{exact:true}).fill(user.email);
 await page.getByLabel(role==='citizen'?'Password':'Officer Security Password',{exact:true}).fill('FixturePassword123!');
 const button=page.getByRole('button',{name:role==='citizen'?'Sign In':'Authenticate as Officer',exact:true});
 if(await button.count()) await button.click(); else await page.getByRole('button').filter({hasText:/sign in|authenticate/i}).click();
 await page.getByText(role==='citizen'?'Quick Issue Categories':'Command Center',{exact:true}).last().waitFor();
}
module.exports={chromium,mockApi,login,complaints,user};
