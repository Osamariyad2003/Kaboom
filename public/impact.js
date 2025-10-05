// Impact module logic extracted from your snippet (condensed for page integration)
(() => {
  const JOULES_PER_MEGATON = 4.184e15;
  const MAX_VISIBLE_MT = 10000;
  const MIN_VISIBLE_MT = 0.1;

  const COUNTRY_COORDINATES = { 'US': { lat: 39.8283, lng: -98.5795 }, 'CN': { lat: 35.8617, lng: 104.1954 }, 'RU': { lat: 61.5240, lng: 105.3188 }, 'JP': { lat: 36.2048, lng: 138.2529 }, 'BR': { lat: -14.2350, lng: -51.9253 }, 'IN': { lat: 20.5937, lng: 78.9629 }, 'AU': { lat: -25.2744, lng: 133.7751 }, 'ZA': { lat: -30.5595, lng: 22.9375 }, 'GB': { lat: 55.3781, lng: -3.4360 }, 'FR': { lat: 46.6034, lng: 1.8883 }, 'DE': { lat: 51.1657, lng: 10.4515 }, 'CA': { lat: 56.1304, lng: -106.3468 }, 'MX': { lat: 23.6345, lng: -102.5528 } };

  const COUNTRY_CITIES = {
    'US': [ {id:'new_york', name:'New York, NY', lat:40.7128, lng:-74.0060, coastal:true, pop:'very-high'}, {id:'los_angeles', name:'Los Angeles, CA', lat:34.0522, lng:-118.2437, coastal:true, pop:'very-high'} ],
    'JP': [ {id:'tokyo', name:'Tokyo', lat:35.6895, lng:139.6917, coastal:true, pop:'very-high'} ],
    'CN': [ {id:'beijing', name:'Beijing', lat:39.9042, lng:116.4074, coastal:false, pop:'very-high'} ],
    'IN': [ {id:'mumbai', name:'Mumbai', lat:19.0760, lng:72.8777, coastal:true, pop:'very-high'} ],
    'BR': [ {id:'sao_paulo', name:'São Paulo', lat:-23.5505, lng:-46.6333, coastal:false, pop:'very-high'} ],
    'RU': [ {id:'moscow', name:'Moscow', lat:55.7558, lng:37.6173, coastal:false, pop:'very-high'} ],
    'AU': [ {id:'sydney', name:'Sydney', lat:-33.8688, lng:151.2093, coastal:true, pop:'high'} ],
    'ZA': [ {id:'johannesburg', name:'Johannesburg', lat:-26.2041, lng:28.0473, coastal:false, pop:'high'} ],
    'GB': [ {id:'london', name:'London', lat:51.5074, lng:-0.1278, coastal:false, pop:'very-high'} ],
    'FR': [ {id:'paris', name:'Paris', lat:48.8566, lng:2.3522, coastal:false, pop:'very-high'} ],
    'DE': [ {id:'berlin', name:'Berlin', lat:52.5200, lng:13.4050, coastal:false, pop:'very-high'} ],
    'CA': [ {id:'toronto', name:'Toronto', lat:43.6532, lng:-79.3832, coastal:false, pop:'very-high'} ],
    'MX': [ {id:'mexico_city', name:'Mexico City', lat:19.4326, lng:-99.1332, coastal:false, pop:'very-high'} ]
  };

  let map = null; let impactMarker = null; let impactCircles = []; let currentImpactLocation = { lat: 40.7128, lng: -74.0060 }; let currentCountry = 'US';

  function placeImpactMarker(coords){ if(!map) return; if(impactMarker){ impactMarker.setPosition(coords);} else { impactMarker = new google.maps.Marker({ position:coords, map, draggable:true, title:'Impact Point', icon:{ path:google.maps.SymbolPath.CIRCLE, fillColor:'#FFC107', fillOpacity:1, strokeWeight:0, scale:8 } }); impactMarker.addListener('dragend', (e)=>{ const p=e.latLng.toJSON(); currentImpactLocation={ lat:p.lat, lng:p.lng }; document.getElementById('lat-lng-display').textContent=`${currentImpactLocation.lat.toFixed(4)}, ${currentImpactLocation.lng.toFixed(4)}`; calculateEnergy(); }); } map.panTo(coords); }
  function clearImpactCircles(){ impactCircles.forEach(c=>c.setMap(null)); impactCircles=[]; }
  function drawImpactCircles(r){ if(!map) return; clearImpactCircles(); if(!r) return; const defs=[ { radius:r.fireball*1000, color:'#DC2626', fillOpacity:.33, strokeWeight:1 }, { radius:r.severeDamage*1000, color:'#F97316', fillOpacity:.18, strokeWeight:2 }, { radius:r.thermalBurn*1000, color:'#FFD700', fillOpacity:.10, strokeWeight:1 } ]; defs.forEach(d=>{ if(!d.radius||d.radius<=0) return; const c=new google.maps.Circle({ strokeColor:d.color, strokeOpacity:.9, strokeWeight:d.strokeWeight, fillColor:d.color, fillOpacity:d.fillOpacity, map, center:currentImpactLocation, radius:d.radius }); impactCircles.push(c); }); const largest=Math.max(r.fireball||0,r.severeDamage||0,r.thermalBurn||0); if(largest>0){ const bc=new google.maps.Circle({center:currentImpactLocation,radius:largest*1000}); map.fitBounds(bc.getBounds()); } }

  const calculateBlastRadius = (mt,C)=>{ if(!mt||mt<=0) return 0; return C*Math.pow(mt,1/3); };
  const isOceanLocation = (lat,lng)=>{ let L=lng; if(L<0) L=360+L; if(lat>-60&&lat<60&&(L>120&&L<260)) return true; if(lat>-60&&lat<60&&((lng>-80&&lng<20))) return true; if(lat>-60&&lat<30&&(lng>20&&lng<120)) return true; if(lat<-50) return true; if(lat>70) return true; return false; };

  function calculateImpactProbabilities(mt, env, diameterKm, meta={}){ const p={}; p.shockwave=Math.min(95,20+18*Math.log10(Math.max(mt,0.1)+1)); if(env==='ocean') p.shockwave*=0.55; p.thermal=Math.min(98,18+16*Math.log10(Math.max(mt,0.1)+1)); if(meta.pop==='very-high') p.thermal=Math.min(100,p.thermal*1.18); p.crater=env==='land'?Math.min(95,40*(1-Math.exp(-mt/25))):0; if(env==='ocean'){ let base=100*(1-Math.exp(-mt/30)); if(meta.coastal) base*=1.0; else base*=0.6; p.tsunami=Math.min(100,base);} else { p.tsunami=0; } p.airburst=(typeof diameterKm==='number'&&diameterKm>0)?Math.max(0,Math.min(95,100-25*diameterKm)):(mt<10?80:Math.max(20,100-mt)); p.climate=Math.min(100,10*Math.log10(Math.max(mt,1))); Object.keys(p).forEach(k=>{ if(!isFinite(p[k])||p[k]<0) p[k]=0; p[k]=Math.round(p[k]*10)/10; }); return p; }

  function updateProbabilityChart(prob){ const container=document.getElementById('probability-bars'); const order=[ {key:'shockwave',label:'Shockwave / Overpressure',color:'#F97316'}, {key:'thermal',label:'Thermal Radiation / Fire',color:'#DC2626'}, {key:'crater',label:'Crater Formation',color:'#8B5CF6'}, {key:'tsunami',label:'Tsunami Generation',color:'#06B6D4'}, {key:'airburst',label:'Airburst',color:'#10B981'}, {key:'climate',label:'Global Climate Effects',color:'#6366F1'} ]; container.innerHTML=order.map(it=>{ const val=prob[it.key]??0; const grad=`linear-gradient(90deg, ${it.color} 0%, ${it.color}CC 60%)`; const width=Math.max(0,Math.min(100,val)); return `<div class="prob-row"><div class="prob-name">${it.label}</div><div class="prob-bar-wrap"><div class="prob-fill" style="width:${width}%;background:${grad};"></div></div><div class="prob-value-label">${width.toFixed(1)}%</div></div>`; }).join(''); }

  const formatScientific=(n)=>{ if(!isFinite(n)||n===0) return '0'; return new Intl.NumberFormat('en-US',{notation:'scientific',maximumSignificantDigits:3}).format(n); };
  const formatFixed=(n,f=1)=>{ if(!isFinite(n)||n===0) return '0.0'; if(n<0.001&&n>0) return formatScientific(n); return (Math.round(n*Math.pow(10,f))/Math.pow(10,f)).toFixed(f).replace(/\B(?=(\d{3})+(?!\d))/g,","); };
  const mapEnergyToPosition=(mt)=>{ if(mt<=MIN_VISIBLE_MT) return 0; if(mt>=MAX_VISIBLE_MT) return 100; const cur=Math.log10(mt); const min=Math.log10(MIN_VISIBLE_MT); const max=Math.log10(MAX_VISIBLE_MT); return Math.min(100,Math.max(0, ((cur-min)/(max-min))*100)); };
  const getSeverityDescription=(mt)=>{ let title='',sub='',color=''; if(mt<10){ title='CODE GREEN: LOCALIZED DISRUPTION'; sub='Low yield — local damage only expected.'; color='text-green-400'; } else if(mt<100){ title='CODE YELLOW: MAJOR REGIONAL THREAT'; sub=`Yield ${formatFixed(mt)} MT — potential regional destruction.`; color='text-yellow-400'; } else if(mt<1000){ title='CODE ORANGE: CONTINENTAL THREAT'; sub=`Yield ${formatFixed(mt)} MT — continental consequences likely.`; color='text-orange-500'; } else { title='CODE RED: EXTINCTION-LEVEL EVENT'; sub=`Yield ${formatFixed(mt)} MT — global catastrophic effects.`; color='text-red-600'; } return {title,subtext:sub,color}; };

  const COMPARISON_EVENTS=[ {name:'Chicxulub (K-Pg)', mtTnt:1e8}, {name:'Tsar Bomba (Max)', mtTnt:50}, {name:'Tunguska Event', mtTnt:15}, {name:'Chelyabinsk (2013)', mtTnt:0.5}, {name:'Beirut Port Blast (2020)', mtTnt:0.003}, {name:'Hiroshima (1945)', mtTnt:0.015} ];
  function updateComparisonTable(mt){ const body=document.getElementById('comparison-body'); const sorted=[...COMPARISON_EVENTS].sort((a,b)=>Math.abs(a.mtTnt-mt)-Math.abs(b.mtTnt-mt)); body.innerHTML=sorted.map(ev=>{ const ratio=mt/ev.mtTnt; let text='0%'; let cls='text-gray-400'; if(isFinite(ratio)&&mt!==0){ if(ratio>=10){ text=`${formatFixed(ratio,0)}x STRONGER`; cls='text-red-500 font-bold'; } else if(ratio>=1){ text=`${formatFixed(ratio,1)}x STRONGER`; cls='text-orange-400 font-bold'; } else if(ratio>0.1){ text=`${formatFixed(ratio*100,0)}% of Event`; cls='text-yellow-400'; } else { text='NEGLIGIBLE'; } } return `<tr class="border-b border-gray-800"><td class="p-2"><span class="font-medium text-gray-200">${ev.name}</span></td><td class="p-2 text-right font-mono">${formatScientific(ev.mtTnt)}</td><td class="p-2 text-center ${cls}">${text}</td></tr>`; }).join(''); }

  function populateCityListForCountry(code){ const sel=document.getElementById('city-select'); if(!sel) return; sel.innerHTML='<option value="">Choose city</option>'; if(!code||!COUNTRY_CITIES[code]) return; COUNTRY_CITIES[code].forEach(c=>{ const opt=document.createElement('option'); opt.value=c.id; opt.dataset.lat=c.lat; opt.dataset.lng=c.lng; opt.textContent=c.name; sel.appendChild(opt); }); }
  window.onCountryChange=function(code){ if(!code) return; currentCountry=code; if(COUNTRY_COORDINATES[code]){ currentImpactLocation={...COUNTRY_COORDINATES[code]}; placeImpactMarker(currentImpactLocation); document.getElementById('lat-lng-display').textContent=`${currentImpactLocation.lat.toFixed(4)}, ${currentImpactLocation.lng.toFixed(4)}`; } populateCityListForCountry(code); document.getElementById('city-select').value=''; calculateEnergy(); };
  window.onCityChange=function(id){ if(!currentCountry||!COUNTRY_CITIES[currentCountry]) return; const city=COUNTRY_CITIES[currentCountry].find(c=>c.id===id); if(!city) return; currentImpactLocation={ lat:city.lat, lng:city.lng }; placeImpactMarker(currentImpactLocation); document.getElementById('lat-lng-display').textContent=`${currentImpactLocation.lat.toFixed(4)}, ${currentImpactLocation.lng.toFixed(4)}`; calculateEnergy(); };

  window.calculateEnergy=function(){ try{ const mass=Math.max(0, parseFloat(document.getElementById('mass-input')?.value)||0); const velKmS=Math.max(0, parseFloat(document.getElementById('velocity-input')?.value)||0); const velMs=velKmS*1000; const ke=0.5*mass*Math.pow(velMs,2); const mt=ke/JOULES_PER_MEGATON; const density=2000; const volume=mass/density; const diameterMeters=2*Math.pow((3*volume)/(4*Math.PI),1/3); const diameterKm=diameterMeters/1000; const env=isOceanLocation(currentImpactLocation.lat,currentImpactLocation.lng)?'ocean':'land'; let C_FIREBALL=0.4, C_SEVERE=1.2, C_THERMAL=13.5; if(env==='ocean'){ C_SEVERE*=0.3; C_THERMAL*=0.8; }
    const r_fire=calculateBlastRadius(mt,C_FIREBALL); const r_severe=calculateBlastRadius(mt,C_SEVERE); const r_thermal=calculateBlastRadius(mt,C_THERMAL);
    document.getElementById('tnt-output').textContent=formatScientific(mt)+' MT';
    document.getElementById('ke-output').textContent='['+formatScientific(ke)+' J]';
    document.getElementById('fireball-radius').textContent=`${formatFixed(r_fire,2)} km`;
    document.getElementById('severe-damage-radius').textContent=`${formatFixed(r_severe,2)} km`;
    document.getElementById('thermal-radius').textContent=`${formatFixed(r_thermal,2)} km`;
    const tsunamiEl=document.getElementById('tsunami-risk'); let tText='NONE', tCls='text-green-300'; if(env==='ocean'){ if(mt>50){ tText='HIGH (Major Tsunami)'; tCls='text-red-500 font-bold'; } else if(mt>5){ tText='MODERATE (Coastal Inundation)'; tCls='text-orange-400'; } else { tText='LOW (Minor Waves)'; } } tsunamiEl.textContent=tText; tsunamiEl.className='font-mono-space text-lg '+tCls;
    const pos=mapEnergyToPosition(mt); const ind=document.getElementById('severity-indicator'); ind.style.left=pos+'%'; const sev=getSeverityDescription(mt); const st=document.getElementById('severity-title'); const ss=document.getElementById('severity-subtext'); st.className=sev.color+" text-xl font-bold"; st.textContent=sev.title; ss.textContent=sev.subtext;
    let cityMeta={ coastal:false, pop:'medium' }; if(currentCountry&&COUNTRY_CITIES[currentCountry]){ const select=document.getElementById('city-select'); const id=select.value; if(id){ const c=COUNTRY_CITIES[currentCountry].find(x=>x.id===id); if(c) cityMeta={coastal:!!c.coastal, pop:c.pop}; }
      else { const anyCoastal=(COUNTRY_CITIES[currentCountry]||[]).some(c=>c.coastal); cityMeta={ coastal:anyCoastal, pop:'high' }; } }
    const probs=calculateImpactProbabilities(mt, env, diameterKm, cityMeta); updateProbabilityChart(probs); drawImpactCircles({ fireball:r_fire, severeDamage:r_severe, thermalBurn:r_thermal }); updateComparisonTable(mt);
  } catch(e){ console.error(e); }};

  window.initMap=function(){ const mapEl=document.getElementById('impact-map'); map=new google.maps.Map(mapEl, { center:currentImpactLocation, zoom:5, mapTypeId:'terrain', styles:[ {elementType:'geometry', stylers:[{color:'#0b1220'}]}, {elementType:'labels.icon', stylers:[{visibility:'off'}]}, {elementType:'labels.text.fill', stylers:[{color:'#9ca3af'}]}, {featureType:'poi', stylers:[{visibility:'off'}]}, {featureType:'road', elementType:'geometry', stylers:[{color:'#162033'}]}, {featureType:'water', elementType:'geometry', stylers:[{color:'#021124'}]} ], zoomControl:true, zoomControlOptions:{ position:google.maps.ControlPosition.RIGHT_TOP }, mapTypeControl:false, streetViewControl:false, fullscreenControl:true });
    placeImpactMarker(currentImpactLocation);
    map.addListener('click', (evt)=>{ const latLng=evt.latLng.toJSON(); currentImpactLocation={ lat:latLng.lat, lng:latLng.lng }; placeImpactMarker(currentImpactLocation); document.getElementById('lat-lng-display').textContent=`${currentImpactLocation.lat.toFixed(4)}, ${currentImpactLocation.lng.toFixed(4)}`; const cs=document.getElementById('country-select'); if(cs) cs.value=''; currentCountry=''; populateCityListForCountry(''); calculateEnergy(); });
    // Geolocate control
    const locateBtn=document.createElement('button'); locateBtn.textContent='Use My Location'; locateBtn.className='btn btn--ghost'; locateBtn.style.margin='8px'; locateBtn.addEventListener('click', ()=>{ if(!navigator.geolocation){ alert('Geolocation not supported'); return; } navigator.geolocation.getCurrentPosition((pos)=>{ const { latitude, longitude }=pos.coords; currentImpactLocation={ lat:latitude, lng:longitude }; placeImpactMarker(currentImpactLocation); document.getElementById('lat-lng-display').textContent=`${currentImpactLocation.lat.toFixed(4)}, ${currentImpactLocation.lng.toFixed(4)}`; calculateEnergy(); }, ()=>alert('Unable to get location')); });
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(locateBtn);
    const countrySel=document.getElementById('country-select'); if(countrySel&&countrySel.value){ window.onCountryChange(countrySel.value); } else { populateCityListForCountry('US'); }
    calculateEnergy(); };

  document.addEventListener('DOMContentLoaded', ()=>{ populateCityListForCountry('US'); calculateEnergy(); const massEl=document.getElementById('mass-input'); const velEl=document.getElementById('velocity-input'); [massEl,velEl].forEach(el=>{ if(!el) return; let t; el.addEventListener('input', ()=>{ clearTimeout(t); t=setTimeout(()=>calculateEnergy(),220); }); }); });
})();


