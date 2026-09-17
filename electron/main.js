const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { requestJson } = require("./license-client");

const dataDir = path.join(app.getPath("userData"), "data");
const dbFile = path.join(dataDir, "omarpos-data.json");
const LICENSE_SERVER_URL = (process.env.OMARPOS_LICENSE_URL || "https://omarpos-license.onrender.com").replace(/\/$/, "");
const initial = { settings:{shopName:"مركز المهندس",owner:"عمر جمعه",phone:"0923487251"}, products:[{id:1,name:"منتج تجريبي 1",barcode:"100001",price:10,stock:25},{id:2,name:"منتج تجريبي 2",barcode:"100002",price:25,stock:12},{id:3,name:"منتج تجريبي 3",barcode:"100003",price:50,stock:8}], customers:[], sales:[], expenses:[], license:{status:"trial",activatedAt:null,expiresAt:null,code:null} };
function ensureStore(){fs.mkdirSync(dataDir,{recursive:true});if(!fs.existsSync(dbFile))fs.writeFileSync(dbFile,JSON.stringify(initial,null,2),"utf8")}
function readStore(){ensureStore();return JSON.parse(fs.readFileSync(dbFile,"utf8"))}
function writeStore(d){fs.writeFileSync(dbFile,JSON.stringify(d,null,2),"utf8");return d}
function createWindow(){const win=new BrowserWindow({width:1400,height:900,minWidth:1050,minHeight:700,backgroundColor:"#050b12",webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false}});win.loadFile(path.join(__dirname,"..","index.html"))}
app.whenReady().then(()=>{ensureStore();ipcMain.handle("store:get",()=>readStore());ipcMain.handle("store:save",(_,data)=>writeStore(data));ipcMain.handle("store:add-sale",(_,sale)=>{const d=readStore();sale.id=Date.now();sale.date=new Date().toISOString();d.sales.push(sale);for(const item of sale.items){const p=d.products.find(x=>x.id===item.id);if(p)p.stock=Math.max(0,p.stock-item.qty)}writeStore(d);return sale});ipcMain.handle("app:data-path",()=>dbFile);ipcMain.handle("license:login",async(_,payload)=>{try{return await requestJson(LICENSE_SERVER_URL,"/api/auth/login",payload)}catch(e){return {status:0,data:{error:"network_error",message:e.message}}}});createWindow();app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
