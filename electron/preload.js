const {contextBridge,ipcRenderer}=require("electron");
contextBridge.exposeInMainWorld("omarpos",{getStore:()=>ipcRenderer.invoke("store:get"),saveStore:data=>ipcRenderer.invoke("store:save",data),addSale:sale=>ipcRenderer.invoke("store:add-sale",sale),dataPath:()=>ipcRenderer.invoke("app:data-path"),licenseLogin:credentials=>ipcRenderer.invoke("license:login",credentials)});
