(() => {
'use strict';
const API='https://adam-notiser.adam-784.workers.dev',KEY='adam-push-v1';
const $=id=>document.getElementById(id);
let registered=null,busy=false;
try{registered=JSON.parse(localStorage.getItem(KEY));}catch(e){}
function status(message){$('pushstatus').textContent=message;}
function controls(){for(const id of ['pushenable','pushtest','pushdisable'])$(id).disabled=busy||(id!=='pushenable'&&!registered);}
function bytes(s){return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));}
async function call(path,token,body){const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body||{}),signal:AbortSignal.timeout(20000)});let data;try{data=await r.json();}catch(e){throw Error('Servern har inte notiskoden ännu. Slutför Cloudflare-inställningarna först.');}if(!r.ok)throw Error(data.error||'Servern svarade '+r.status);return data;}
function supported(){if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw Error('Notiser stöds inte här. På iPhone: lägg appen på hemskärmen och öppna den därifrån.');const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);if(ios&&!window.matchMedia('(display-mode: standalone)').matches&&!navigator.standalone)throw Error('Öppna appen från hemskärmen först. Använd Dela → Lägg till på hemskärmen i Safari.');}
$('pushenable').onclick=async()=>{if(busy)return;busy=true;controls();try{supported();const code=$('paircode').value.trim();if(code.length<16)throw Error('Ange aktiveringskoden du sparade som PAIRING_CODE i Cloudflare, minst 16 tecken.');
 const permission=await Notification.requestPermission(); // Direkt från användarens knapptryckning.
 if(permission!=='granted')throw Error('Notiser är inte tillåtna. Ändra tillståndet i iPhones Inställningar → Notiser för den här appen.');
 status('Ansluter notiser…');
 const {publicKey}=await call('/key',code);const registration=await navigator.serviceWorker.ready;
 let subscription=await registration.pushManager.getSubscription();
 if(subscription){const old=new Uint8Array(subscription.options.applicationServerKey||[]);const target=bytes(publicKey);if(old.length!==target.length||old.some((v,i)=>v!==target[i])){await subscription.unsubscribe();subscription=null;}}
 if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes(publicKey)});
 const data=await call('/subscribe',code,subscription.toJSON());
 if(typeof data.token!=='string')throw Error('Ogiltigt serversvar.');
 registered={token:data.token};try{localStorage.setItem(KEY,JSON.stringify(registered));}catch(e){await call('/unsubscribe',data.token).catch(()=>{});await subscription.unsubscribe();registered=null;throw Error('Enheten kan inte spara inställningen. Aktiveringen kunde inte slutföras.');}
 $('paircode').value='';status('Notiser registrerade! Vänta en minut och tryck sedan på Skicka testnotis. Aktiveringskoden sparas inte i appen.');
}catch(e){status(e.message);}finally{busy=false;controls();}};
$('pushtest').onclick=async()=>{if(busy||!registered)return;busy=true;controls();try{status('Skickar testnotis…');await call('/test',registered.token);status('Testnotisen har skickats till push-tjänsten. Kontrollera låsskärmen eller Notiscenter.');}catch(e){status(e.message);}finally{busy=false;controls();}};
$('pushdisable').onclick=async()=>{if(busy||!registered)return;busy=true;controls();try{await call('/unsubscribe',registered.token);const registration=await navigator.serviceWorker.ready;const sub=await registration.pushManager.getSubscription();if(sub)await sub.unsubscribe();registered=null;localStorage.removeItem(KEY);status('Notiser avstängda.');}catch(e){status(e.message);}finally{busy=false;controls();}};
status(registered?'Enheten är registrerad. Använd Skicka testnotis för att kontrollera leveransen.':'Notiser är inte aktiverade.');controls();
})();
