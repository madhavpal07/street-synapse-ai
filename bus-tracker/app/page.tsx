"use client";
import {useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
import {io} from 'socket.io-client';
import {TransitHeader} from '../components/transit-header';
import {BottomNav} from '../components/bottom-nav';
import {MapPin,Search,ArrowDownUp,Navigation2,Plus,Minus,Navigation,Bus,Clock} from 'lucide-react';
import {routes,matchingRoutes,distanceKm} from '../lib/routes';
import {ageLabel,busStatus} from '../lib/status';
const LiveMap=dynamic(()=>import('../components/live-map'),{ssr:false,loading:()=> <div className="p-8 text-slate-500">Loading map…</div>});
type LiveBus={busId:string;connected:boolean;lastReceivedAt:number|null;status:string;position:null|{latitude:number;longitude:number;speed:number|null;heading:number|null;accuracy:number;timestamp:number}};
export default function Passenger(){
 const [fleet,setFleet]=useState<LiveBus[]>([]),[online,setOnline]=useState(false),[now,setNow]=useState(Date.now());
 const [from,setFrom]=useState('quantum'),[to,setTo]=useState('railway'),[journey,setJourney]=useState<{from:string;to:string}|null>(null);
 const [selected,setSelected]=useState('BUS-001'),[tab,setTab]=useState('live'),[error,setError]=useState('');
 const [target,setTarget]=useState<[number,number]|null>(null),[user,setUser]=useState<[number,number]|null>(null),[zoom,setZoom]=useState<any>(null);
 useEffect(()=>{
  const socket=io({auth:{role:'passenger'}});
  socket.on('connect',()=>{setOnline(true);setError('');});socket.on('disconnect',()=>setOnline(false));
  socket.on('connect_error',()=>{setOnline(false);setError('Connection unavailable. Reconnecting…');});
  socket.on('fleet:snapshot',(data:{buses:LiveBus[]})=>setFleet(data.buses));
  socket.on('bus:update',({bus}:{bus:LiveBus})=>setFleet(old=>[...old.filter(b=>b.busId!==bus.busId),bus].sort((a,b)=>a.busId.localeCompare(b.busId))));
  const timer=setInterval(()=>setNow(Date.now()),1000);return()=>{clearInterval(timer);socket.disconnect();};
 },[]);
 const matches=journey?matchingRoutes(journey.from,journey.to):routes,route=matches[0];
 const buses=fleet.filter(b=>route?.busIds.includes(b.busId)).map(b=>({...b,status:online?busStatus(b,now):'offline'}));
 const current=buses.find(b=>b.busId===selected)||buses[0],stop=route?.stops.find(s=>s.id===(journey?.from||from));
 useEffect(()=>{if(current?.position)setTarget([current.position.latitude,current.position.longitude]);},[current?.busId,Boolean(current?.position)]);
 const distance=current?.position&&stop?distanceKm(current.position,stop):null;
 function locate(){if(!navigator.geolocation){setError('Location is unavailable in this browser.');return;}navigator.geolocation.getCurrentPosition(p=>{const point:[number,number]=[p.coords.latitude,p.coords.longitude];setUser(point);setTarget(point);setError('');},()=>setError('Could not get your location. Allow location access and use HTTPS.'),{enableHighAccuracy:true,timeout:15000});}
 return <div className="mx-auto max-w-[520px] min-h-screen bg-slate-50 text-slate-900 shadow-xl font-sans pb-20">
 <TransitHeader online={online}/>
 <div className="flex gap-6 bg-white px-5 border-b"><button onClick={()=>setTab('live')} className={`py-3 text-sm font-semibold ${tab==='live'?'text-blue-600 border-b-2 border-blue-600':''}`}>Live Tracking</button><button onClick={()=>setTab('timetable')} className={`py-3 text-sm ${tab==='more'?<section className="p-6 text-sm space-y-4"><h2 className="text-xl font-bold">About this demo</h2><p>Phone drivers share GPS with permission. Passengers can view bus locations without a key.</p><p>Route 104 and stop coordinates are sample configuration. Fares, timetable and ETA are not yet verified.</p><p>Green markers: live. Amber: stale GPS. Grey: offline last known location. Phone GPS accuracy can vary.</p></section>:tab==='timetable'?'text-blue-600':''}`}>Timetable / समय सारणी</button></div>
 {error&&<p role="alert" className="p-3 bg-amber-50 text-amber-900 text-sm">{error}</p>}
 {tab==='more'?<section className="p-6 text-sm space-y-4"><h2 className="text-xl font-bold">About this demo</h2><p>Phone drivers share GPS with permission. Passengers can view bus locations without a key.</p><p>Route 104 and stop coordinates are sample configuration. Fares, timetable and ETA are not yet verified.</p><p>Green markers: live. Amber: stale GPS. Grey: offline last known location. Phone GPS accuracy can vary.</p></section>:tab==='timetable'?<section className="p-6"><h2 className="font-bold text-lg">Timetable not configured</h2><p className="mt-3 text-slate-600">Operator-verified departure times and fares have not been added. Live GPS does not provide a timetable.</p><button onClick={()=>setTab('live')} className="mt-6 text-blue-700">Back to live tracking</button></section>:<>
 <section className="m-4 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
 <div className="flex gap-3 items-center"><MapPin className="text-emerald-600"/><label className="flex-1 bg-slate-50 p-2 rounded-xl text-xs text-slate-500">FROM<select aria-label="Boarding stop" value={from} onChange={e=>setFrom(e.target.value)} className="block w-full bg-transparent text-sm text-slate-900 py-1">{routes[0].stops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
 <button aria-label="Swap stops" onClick={()=>{setFrom(to);setTo(from);}} className="block ml-auto my-1 p-1 text-blue-700"><ArrowDownUp size={18}/></button>
 <div className="flex gap-3 items-center"><Search className="text-blue-600"/><label className="flex-1 bg-slate-50 p-2 rounded-xl text-xs text-slate-500">TO<select aria-label="Destination stop" value={to} onChange={e=>setTo(e.target.value)} className="block w-full bg-transparent text-sm text-slate-900 py-1">{routes[0].stops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
 <button onClick={()=>{setJourney({from,to});setError('');}} className="w-full bg-blue-600 text-white rounded-xl mt-4 py-3 flex gap-2 justify-center items-center font-medium"><Navigation2 size={17}/>Find Live Buses</button>
 <p className="text-[11px] text-slate-500 mt-3">Demo route 104 • Stop locations and dotted route are illustrative. Phone bus positions are real when sharing.</p>
 </section>
 {!route?<p role="status" className="p-5 bg-amber-50">No configured route serves these stops in this direction. Choose a later destination stop.</p>:<>
 <div className="px-4 pb-3 flex gap-2 flex-wrap">{buses.map(b=><button key={b.busId} onClick={()=>{setSelected(b.busId);if(b.position)setTarget([b.position.latitude,b.position.longitude]);}} className={`px-3 py-2 rounded-xl border text-sm ${current?.busId===b.busId?'bg-blue-600 text-white':'bg-white'}`}>{b.busId} · {b.status}</button>)}{!buses.length&&<p className="text-sm text-slate-500">Waiting for configured buses…</p>}</div>
 <div className="relative h-[380px] mx-4 rounded-2xl overflow-hidden border border-slate-200"><LiveMap buses={buses} route={route} selected={current?.busId} onSelect={setSelected} target={target} user={user} zoomDelta={zoom}/>
 <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">{[[Plus,'Zoom in',()=>setZoom({direction:1,time:Date.now()})],[Minus,'Zoom out',()=>setZoom({direction:-1,time:Date.now()})],[Navigation,'My location',locate],[Bus,'Recenter bus',()=>{if(current?.position)setTarget([current.position.latitude,current.position.longitude]);else setError('No GPS fix for this bus yet.');}]].map(([Icon,label,action]:any)=><button key={label} aria-label={label} onClick={action} className="rounded-xl bg-white p-3 shadow text-blue-700"><Icon size={18}/></button>)}</div></div>
 <section className="bg-white rounded-t-[2rem] border mt-4 p-5 shadow-sm">
 <div className="flex justify-between"><div><p data-testid="gps-status" className="text-xs font-bold text-emerald-700 uppercase">{current?.status==='live'?'Live GPS':current?.status==='stale'?'GPS reading is stale':current?.status==='offline'?'Offline · last known location':'Waiting for live GPS'}</p><h2 className="text-2xl font-extrabold mt-1">{current?.busId||'No bus connected'}</h2></div><span className="bg-emerald-100 text-emerald-800 rounded-xl p-3 h-fit text-sm font-bold">104</span></div>
 <p className="text-xs text-slate-500 mt-2">Last GPS fix: {ageLabel(current?.position?.timestamp,now)} · {online?'Feed connected':'Feed disconnected'}</p>
 <div className="grid grid-cols-3 gap-2 my-5">{[['Speed',current?.position?.speed!=null&&current.status==='live'?`${(current.position.speed*3.6).toFixed(1)} km/h`:'Unavailable'],['To boarding stop',distance!==null?`${distance.toFixed(2)} km`:'Unavailable'],['GPS accuracy',current?.position?`±${Math.round(current.position.accuracy)} m`:'Unavailable']].map(([title,value])=><div key={title} className="bg-slate-50 rounded-xl p-3"><div className="font-bold text-sm">{value}</div><div className="text-[10px] text-slate-500 mt-1">{title}</div></div>)}</div>
 <p className="text-xs text-slate-500">Distance is straight-line from the last GPS fix. Stale/offline markers show last known position.</p><p className="mt-4 text-sm flex gap-2"><Clock size={17}/>ETA unavailable until route-distance and arrival logic are verified.</p>
 <h3 className="font-bold mt-5 mb-2">Route & Stops</h3><ol className="border-l-2 border-blue-100 ml-2 pl-4 space-y-3 text-sm">{route.stops.map(s=><li key={s.id} className={s.id===(journey?.from||from)||s.id===(journey?.to||to)?'text-blue-700 font-semibold':'text-slate-500'}>{s.name}{s.id===(journey?.from||from)?' · Board here':''}{s.id===(journey?.to||to)?' · Drop off':''}</li>)}</ol><p className="text-xs text-slate-500 mt-5">Fare and vehicle amenities: not configured.</p>
 </section></>}
 </>}
 <BottomNav activeTab={tab} onHomeClick={()=>{setTab('live');setJourney(null);window.scrollTo({top:0});}} onLiveClick={()=>setTab('live')} onTimetableClick={()=>setTab('timetable')} onNearbyClick={()=>{setTab('live');locate();}} onMoreClick={()=>setTab('more')}/>
 <footer className="p-5 text-center text-xs text-slate-400">StreetSynapse · Smartphone-powered tracking</footer></div>;
}
