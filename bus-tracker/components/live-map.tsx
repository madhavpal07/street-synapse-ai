"use client";
import {useEffect,useState} from 'react';
import {MapContainer,TileLayer,Marker,CircleMarker,Polyline,Popup,useMap} from 'react-leaflet';
import L from 'leaflet';
function Controller({target,zoomDelta}:any){const map=useMap();useEffect(()=>{if(target)map.flyTo(target,map.getZoom());},[target,map]);useEffect(()=>{if(zoomDelta)map.setZoom(Math.max(3,Math.min(19,map.getZoom()+zoomDelta.direction)));},[zoomDelta,map]);useEffect(()=>{const observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(map.getContainer());return()=>observer.disconnect();},[map]);return null;}
export default function LiveMap({buses,route,selected,onSelect,target,user,zoomDelta}:any){
 const [tileError,setTileError]=useState(false);
 const icon=(status:string)=>L.divIcon({className:'',html:`<div style="background:${status==='live'?'#059669':status==='stale'?'#d97706':'#64748b'};border:3px solid white;border-radius:50%;width:32px;height:32px;display:grid;place-items:center;box-shadow:0 2px 8px #0004;color:white"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2"><rect x="5" y="3" width="14" height="16" rx="3"/><path d="M5 11h14M8 19v3M16 19v3M8 15h1M15 15h1"/></svg></div>`,iconSize:[32,32],iconAnchor:[16,16]});
 return <><MapContainer center={[29.89,77.85]} zoom={12} zoomControl={false} className="h-full w-full"><TileLayer attribution='&copy; OpenStreetMap &copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" eventHandlers={{tileerror:()=>setTileError(true),load:()=>{}}}/>
 {route&&<Polyline positions={route.stops.map((s:any)=>[s.latitude,s.longitude])} color="#3b82f6" dashArray="6 8" weight={3}/>}
 {route?.stops.map((s:any)=><CircleMarker key={s.id} center={[s.latitude,s.longitude]} radius={5} pathOptions={{color:'#2563eb',fillColor:'white',fillOpacity:1}}><Popup>{s.name}<br/>Demo stop</Popup></CircleMarker>)}
 {buses.filter((b:any)=>b.position).map((b:any)=><Marker key={b.busId} position={[b.position.latitude,b.position.longitude]} icon={icon(b.status)} zIndexOffset={b.busId===selected?100:0} eventHandlers={{click:()=>onSelect(b.busId)}}><Popup>{b.busId} · {b.status}<br/>GPS accuracy ±{Math.round(b.position.accuracy)} m</Popup></Marker>)}
 {user&&<CircleMarker center={user} radius={7} pathOptions={{color:'white',fillColor:'#2563eb',fillOpacity:1}}><Popup>Your location</Popup></CircleMarker>}<Controller target={target} zoomDelta={zoomDelta}/></MapContainer>{tileError&&<div role="status" className="absolute bottom-7 left-2 right-2 z-[550] rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900">Street tiles could not load. Check internet access and reload. GPS markers remain available.</div>}</>;
}
