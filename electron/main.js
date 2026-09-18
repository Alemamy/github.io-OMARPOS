const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { requestJson } = require('./license-client');

const dataDir=path.join(app.getPath('userData'),'data');
const dbFile=path.join(dataDir,'omarpos-data.json');
const initial={settings:{shopName:'مركز المهندس',owner:'عمر جمعه',phone:'0923487251'},products:[{id:1,name:'منتج تجريبي 1',barcode:'100001',price:10,minPrice:8,costPrice:5,stock:25},{id:2,name:'منتج تجريبي 2',barcode:'100002',price:25,minPrice:20,costPrice:15,stock:12},{id:3,name:'منتج تجريبي 3',barcode:'100003',price:50,minPrice:40,costPrice:30,stock:8}],customers:[],suppliers:[],purchases:[],expenses:[],returns:[],accounts:[],receipts:[],payments:[],sales:[],license:{status:'trial',activatedAt:null,expiresAt:null,code:null}};
function ensureStore(){fs.mkdirSync(dataDir,{recursive:true});if(!fs.existsSync(dbFile))fs.writeFileSync(dbFile,JSON.stringify(initial,null,2),'utf8')}
function normalizeStore(d){d=d&&typeof d==='object'?d:{};['products','sales','customers','suppliers','purchases','expenses','returns','accounts','receipts','payments'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});if(!d.settings||typeof d.settings!=='object')d.settings={...initial.settings};d.products.forEach(p=>{p.price=Number(p.price||0);p.minPrice=Number(p.minPrice??0);p.costPrice=Number(p.costPrice??0);p.stock=Number(p.stock||0)});return d}
function readStore(){ensureStore();try{return normalizeStore(JSON.parse(fs.readFileSync(dbFile,'utf8')))}catch(e){try{fs.copyFileSync(dbFile,dbFile+'.corrupt-'+Date.now()+'.json')}catch{};fs.writeFileSync(dbFile,JSON.stringify(initial,null,2),'utf8');return normalizeStore({...initial})}}
function writeStore(d){d=normalizeStore(d);fs.mkdirSync(dataDir,{recursive:true});const tmp=dbFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(d,null,2),'utf8');fs.renameSync(tmp,dbFile);return d}
function createWindow(){const win=new BrowserWindow({width:1400,height:900,minWidth:1050,minHeight:700,backgroundColor:'#050b12',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});win.loadFile(path.join(__dirname,'..','index.html'))}
app.whenReady().then(()=>{ensureStore();
ipcMain.handle('store:get',()=>readStore());
ipcMain.handle('store:save',(_,data)=>writeStore(data));
ipcMain.handle('store:add-sale',(_,input)=>{const d=readStore(),sale=input&&typeof input==='object'?input:{},items=Array.isArray(sale.items)?sale.items:[];if(!items.length)throw new Error('الفاتورة فارغة');const normalized=[];let subtotal=0;
for(const item of items){const id=Number(item.id),qty=Number(item.qty),price=Number(item.price);if(!Number.isInteger(id)||!Number.isInteger(qty)||qty<=0||!Number.isFinite(price)||price<0)throw new Error('بيانات الصنف غير صحيحة');const p=d.products.find(x=>Number(x.id)===id);if(!p)throw new Error('الصنف غير موجود');const min=Number(p.minPrice||0);if(price<min)throw new Error('سعر البيع للصنف «'+p.name+'» أقل من الحد الأدنى '+min.toFixed(2)+' د.ل');if(Number(p.stock||0)<qty)throw new Error('المخزون غير كافٍ للصنف: '+p.name);normalized.push({id,name:String(p.name||item.name||''),qty,price,minPrice:min});subtotal+=price*qty}
const discount=Number(sale.discount||0);if(!Number.isFinite(discount)||discount<0||discount>subtotal)throw new Error('الخصم غير صحيح');
const saved={items:normalized,subtotal:Number(subtotal.toFixed(2)),discount:Number(discount.toFixed(2)),total:Number((subtotal-discount).toFixed(2)),id:Date.now(),date:new Date().toISOString()};d.sales.push(saved);for(const item of normalized){const p=d.products.find(x=>Number(x.id)===item.id);p.stock=Math.max(0,Number(p.stock||0)-item.qty)}writeStore(d);return saved});
ipcMain.handle('app:data-path',()=>dbFile);
ipcMain.handle('license:login',async(_,payload)=>{try{return await requestJson(process.env.OMARPOS_LICENSE_URL||'https://omarpos-license.onrender.com','/api/auth/login',payload)}catch(e){return {status:0,data:{error:'network_error',message:e.message}}}});
createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
