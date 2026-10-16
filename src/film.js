/* ===========================================================================
   CADENCE — film engine.  Inlined into index.html by build.py.
   The engine never mentions a beat by name: everything it needs (labels, the
   dial, sub-thump timings, how many states exist) arrives in window.FILM,
   generated from slides/*/*.yaml.  Add a YAML file, rerun the build, and the
   film grows a state with no edit here.
   =========================================================================== */
"use strict";

/* ---- A · sound design ----------------------------------------------------
   Synthesised with WebAudio.  No base64 payloads: click / whoosh / thump cost
   ~3 KB of code instead of ~200 KB of encoded WAV, and stay re-tunable. */
const SFX = (function(){
  let ctx=null, master=null, noise=null, muted=false;
  const AC = window.AudioContext || window.webkitAudioContext;

  function init(){
    if(ctx){ if(ctx.state === "suspended") ctx.resume().catch(function(){}); return; }
    if(!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();          // glue + clip guard
    comp.threshold.value = -15; comp.knee.value = 16; comp.ratio.value = 9;
    comp.attack.value = .003;  comp.release.value = .22;
    master = ctx.createGain(); master.gain.value = .5;
    master.connect(comp); comp.connect(ctx.destination);
    const n = Math.floor(ctx.sampleRate * .8);             // one shared noise bed
    noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for(let i=0;i<n;i++) d[i] = Math.random()*2-1;
  }
  function src(){ const s = ctx.createBufferSource(); s.buffer = noise; return s; }
  function g(v){ const x = ctx.createGain(); x.gain.value = v; return x; }
  function env(p, t, a, peak, d){                          // percussive envelope
    p.gain.setValueAtTime(.0001, t);
    p.gain.exponentialRampToValueAtTime(peak, t + a);
    p.gain.exponentialRampToValueAtTime(.0001, t + a + d);
  }
  function drive(k){                                       // soft saturation
    const ws = ctx.createWaveShaper(), n = 1024, c = new Float32Array(n);
    for(let i=0;i<n;i++){ const x = i/(n-1)*2-1; c[i] = Math.tanh(k*x)/Math.tanh(k); }
    ws.curve = c; return ws;
  }
  function click(){                                        // crisp high-frequency click
    if(!ctx||muted) return; const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "triangle";
    o.frequency.setValueAtTime(3400,t); o.frequency.exponentialRampToValueAtTime(1300,t+.05);
    const p = g(0); env(p,t,.003,.30,.055); o.connect(p).connect(master); o.start(t); o.stop(t+.1);
    const s = src(), hp = ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=4400;
    const p2 = g(0); env(p2,t,.002,.20,.028);
    s.connect(hp).connect(p2).connect(master); s.start(t); s.stop(t+.06);
  }
  function whoosh(){                                       // deep whoosh during morphs
    if(!ctx||muted) return; const t = ctx.currentTime, D = .78;
    const s = src(), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.05;
    bp.frequency.setValueAtTime(230,t);
    bp.frequency.exponentialRampToValueAtTime(5600,t + D*.72);
    bp.frequency.exponentialRampToValueAtTime(620,t + D);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7200;
    const p = g(0); env(p,t,.09,.32,D*.5);
    let node = s.connect(bp).connect(lp);
    if(ctx.createStereoPanner){
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(-.85,t); pan.pan.linearRampToValueAtTime(.85,t+D);
      node = node.connect(pan);
    }
    node.connect(p).connect(master); s.start(t); s.stop(t + D + .1);
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(158,t); o.frequency.exponentialRampToValueAtTime(50,t + D*.85);
    const p2 = g(0); env(p2,t,.06,.20,D*.5); o.connect(p2).connect(master); o.start(t); o.stop(t + D + .1);
  }
  function thump(){                                        // heavy sub-thump on lock
    if(!ctx||muted) return; const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(118,t); o.frequency.exponentialRampToValueAtTime(33,t+.55);
    const p = g(0); env(p,t,.012,.85,.68);
    o.connect(drive(2.2)).connect(p).connect(master); o.start(t); o.stop(t+.85);
    [69,104].forEach(function(f,i){                        // harmonics: audible on laptops
      const h = ctx.createOscillator(); h.type = i ? "triangle" : "sine";
      h.frequency.setValueAtTime(f,t); h.frequency.exponentialRampToValueAtTime(f*.55,t+.4);
      const hp = g(0); env(hp,t,.008,.16/(i+1),.34);
      h.connect(hp).connect(master); h.start(t); h.stop(t+.5);
    });
    const s = src(), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 170;
    const p3 = g(0); env(p3,t,.005,.42,.22);
    s.connect(lp).connect(p3).connect(master); s.start(t); s.stop(t+.35);
  }
  function back(){                                         // reverse sweep
    if(!ctx||muted) return; const t = ctx.currentTime, D = .34;
    const s = src(), bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.6;
    bp.frequency.setValueAtTime(3600,t); bp.frequency.exponentialRampToValueAtTime(420,t+D);
    const p = g(0); env(p,t,.006,.20,D*.6);
    s.connect(bp).connect(p).connect(master); s.start(t); s.stop(t + D + .06);
    const o = ctx.createOscillator(); o.type = "triangle";
    o.frequency.setValueAtTime(1500,t); o.frequency.exponentialRampToValueAtTime(700,t+.06);
    const p2 = g(0); env(p2,t,.003,.16,.07); o.connect(p2).connect(master); o.start(t); o.stop(t+.12);
  }
  return { init:init, click:click, whoosh:whoosh, thump:thump, back:back,
           toggle:function(){ muted = !muted; return muted; } };
})();

/* ---- B · machinery: SVG type fitting + exact pen-stroke dashes ----------- */
const FILM   = window.FILM || { beats:[{label:"cold open"}], dial:null, brand:"" };
const LAST   = FILM.beats.length - 1;
const LAYERS = Array.prototype.slice.call(document.querySelectorAll(".layer"));

/* Display type is authored as SVG <text> so it can be drawn, but it has to
   fill a target width exactly on any font.  Measure the natural advance of the
   longest line, set ONE shared font-size for the block, then re-hug the viewBox
   to the ink so the strokes can never clip. */
function fitSvg(svg){
  const g = svg.querySelector("g"); if(!g) return;
  const lines = Array.prototype.slice.call(g.querySelectorAll("text"));
  if(!lines.length) return;
  const ref = parseFloat(svg.dataset.ref || 190);
  const target = parseFloat(svg.dataset.fit || 1120);
  const centred = svg.dataset.align === "center";

  lines.forEach(function(l){
    l.setAttribute("font-size", ref);
    l.removeAttribute("textLength"); l.removeAttribute("lengthAdjust");  // measure the raw advance
  });
  let longest = 0, maxAdv = 0;
  lines.forEach(function(l,i){ const a = l.getComputedTextLength(); if(a > maxAdv){ maxAdv = a; longest = i; } });
  if(!maxAdv) return;

  let size = ref * target / maxAdv;
  size = Math.max(ref*.45, Math.min(ref*2.4, size));
  const lead = size * 1.14;
  lines.forEach(function(l,i){
    l.setAttribute("font-size", size);
    l.setAttribute("x", centred ? target/2 : 0);
    l.setAttribute("y", (i*lead + size*.80).toFixed(2));
    if(centred) l.setAttribute("text-anchor","middle");
    if(i === longest){ l.setAttribute("textLength", target); l.setAttribute("lengthAdjust","spacingAndGlyphs"); }
    else { l.removeAttribute("textLength"); l.removeAttribute("lengthAdjust"); }
    /* provisional dash: a safe over-estimate, refined by measureDash() */
    if(!l.style.getPropertyValue("--dash")){
      l.style.setProperty("--dash", Math.round(9 * size * Math.max(1, l.textContent.replace(/\s/g,"").length)));
    }
  });
  const b = g.getBBox(), pad = size*.09;
  if(b.width > 0){
    svg.setAttribute("viewBox", [b.x-pad, b.y-pad, b.width+pad*2, b.height+pad*2]
      .map(function(v){ return +v.toFixed(2); }).join(" "));
  }
}
function fitAll(){ document.querySelectorAll("svg.tsvg").forEach(fitSvg); }

/* Chromium ignores pathLength on <text> and restarts the dash pattern on every
   glyph outline, so the only correct dasharray is the LONGEST SINGLE GLYPH on
   the line.  Measured by rasterising the real font stack into a column
   histogram: outlineLen = inkArea / strokeWidth.  With that number the trace
   starts blank, advances evenly, and lands exactly as the fill floods in. */
function alphaColumns(svgString, W, H){
  return new Promise(function(resolve){
    const img = new Image();
    img.onload = function(){
      try{
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        const x = c.getContext("2d"); x.drawImage(img,0,0);
        const d = x.getImageData(0,0,W,H).data;
        const cols = new Float64Array(W);
        for(let i=3,p=0;i<d.length;i+=4,p++) cols[p % W] += d[i]/255;
        resolve(cols);
      }catch(e){ resolve(null); }
    };
    img.onerror = function(){ resolve(null); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
  });
}
function glyphAdvances(el){
  const text = el.textContent, probe = el.cloneNode(true);
  probe.removeAttribute("textLength"); probe.removeAttribute("lengthAdjust");
  probe.setAttribute("visibility","hidden"); probe.setAttribute("x","0"); probe.setAttribute("y","0");
  el.parentNode.appendChild(probe);
  const bounds = [];
  for(let k=0;k<text.length;k++){ probe.textContent = text.slice(0,k+1); bounds.push(probe.getComputedTextLength()); }
  probe.remove();
  return bounds;
}
async function glyphDash(el){
  const fs = parseFloat(el.getAttribute("font-size"));
  if(!fs) return 0;
  const text = el.textContent;
  if(!text.trim()) return 0;
  const cs = getComputedStyle(el);
  const bounds = glyphAdvances(el);
  if(!bounds.length) return 0;
  const w = Math.max(2, fs*.06), pad = fs*.6;
  const W = Math.ceil(bounds[bounds.length-1] + pad*2), H = Math.ceil(fs*2.2);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'
    + '<text x="'+pad+'" y="'+(fs*1.45)+'" font-family="'+cs.fontFamily.replace(/"/g,"'")+'" font-size="'+fs
    + '" font-weight="'+cs.fontWeight+'" letter-spacing="'+cs.letterSpacing
    + '" fill="none" stroke="#000" stroke-width="'+w+'">'+ text.replace(/[&<>]/g,"") + '</text></svg>';
  const cols = await alphaColumns(svg, W, H);
  if(!cols) return 0;
  let max = 0;
  for(let k=0;k<text.length;k++){
    if(!text[k].trim()) continue;
    const a = Math.floor(pad + (k ? bounds[k-1] : 0)), b = Math.min(W, Math.ceil(pad + bounds[k]));
    let area = 0; for(let x=a;x<b;x++) area += cols[x];
    max = Math.max(max, area / w * 1.06);            // + joins / self-intersections
  }
  return max ? Math.round(max * 1.06) : 0;
}
let dashMeasured = false;
async function measureDash(){
  if(dashMeasured) return; dashMeasured = true;
  for(const l of Array.prototype.slice.call(document.querySelectorAll("svg.tsvg text"))){
    const dash = await glyphDash(l);
    if(dash) l.style.setProperty("--dash", dash);     // else keep the safe provisional
  }
}

/* masked word reveals + the stepped bar field */
document.querySelectorAll("[data-words]").forEach(function(el){
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach(function(w,i){
    const s = document.createElement("span"); s.className = "w";
    s.style.setProperty("--i", i);
    const inner = document.createElement("i"); inner.textContent = w;
    s.appendChild(inner); el.appendChild(s);
    if(i < words.length-1) el.appendChild(document.createTextNode(" "));
  });
});
document.querySelectorAll("[data-bars]").forEach(function(el){
  for(let i=0;i<+el.dataset.bars;i++){
    const b = document.createElement("i");
    b.style.setProperty("--i", i);
    el.appendChild(b);
  }
});

/* ---- C · state machine -------------------------------------------------- */
const FLAGS = new Set();
let state = 0, lockTimer = 0, dialRAF = 0;

const beatTag = document.getElementById("beatTag");
const beatNum = document.getElementById("beatNum");
const sndTag  = document.getElementById("sndTag");
const dialNum = document.getElementById("dialNum");

function sync(){
  const cls = Array.from(FLAGS);
  cls.push("state-" + state);
  if(state === LAST) cls.push("state-last");
  document.body.className = cls.join(" ");
}
function hud(){
  beatTag.textContent = FILM.beats[state].label;
  beatNum.textContent = (state < 10 ? "0" : "") + state;
}
function runDial(){
  cancelAnimationFrame(dialRAF);
  if(!dialNum) return;
  if(FLAGS.has("reduced")){ dialNum.textContent = FILM.dial.target; return; }
  const t0 = performance.now(), D = 1700, target = FILM.dial.target;
  dialNum.textContent = "0";
  (function step(now){
    const t = Math.min(1, (now - t0) / D);
    dialNum.textContent = Math.round((1 - Math.pow(1-t,3)) * target);
    if(t < 1) dialRAF = requestAnimationFrame(step);
  })(t0);
}
function go(next){
  next = Math.max(0, Math.min(LAST, next|0));
  if(next === state){ SFX.click(); return; }        /* the last beat lingers forever */
  const fwd = next > state;
  state = next;
  sync(); hud();
  LAYERS.forEach(function(l){ l.classList.toggle("is-live", +l.dataset.beat === state); });
  SFX.whoosh();
  fwd ? SFX.click() : SFX.back();
  clearTimeout(lockTimer);
  const lock = FILM.beats[state].lock;
  if(lock) lockTimer = setTimeout(function(){ SFX.thump(); }, lock);
  if(FILM.dial && FILM.dial.state === state) runDial(); else cancelAnimationFrame(dialRAF);
}

/* ---- D · input ---------------------------------------------------------- */
addEventListener("keydown", function(e){
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  SFX.init();
  if(k === " " || k === "ArrowRight" || k === "ArrowDown" || k === "PageDown"){ e.preventDefault(); go(state+1); }
  else if(k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp"){ e.preventDefault(); go(state-1); }
  else if(k === "Home" || k === "0"){ e.preventDefault(); go(0); }
  else if(/^[1-9]$/.test(k) && +k <= LAST){ e.preventDefault(); go(+k); }
  else if(k === "m" || k === "M"){
    const m = SFX.toggle(); if(!m) SFX.click();
    m ? FLAGS.add("muted") : FLAGS.delete("muted"); sync();
    if(sndTag) sndTag.textContent = "M · sound " + (m ? "off" : "on");
  }
  else if(k === "r" || k === "R"){
    FLAGS.has("reduced") ? FLAGS.delete("reduced") : FLAGS.add("reduced");
    sync(); if(FILM.dial && FILM.dial.state === state) runDial();
  }
  else if(k === "g" || k === "G"){ FLAGS.has("grid") ? FLAGS.delete("grid") : FLAGS.add("grid"); sync(); }
  else if(k === "c" || k === "C"){ FLAGS.has("no-cursor") ? FLAGS.delete("no-cursor") : FLAGS.add("no-cursor"); sync(); }
  else if(k === "f" || k === "F"){
    if(document.fullscreenElement) document.exitFullscreen();
    else if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }
});
document.addEventListener("pointerdown", function(){ SFX.init(); go(state+1); });

/* ---- E · boot ----------------------------------------------------------- */
function boot(){ fitAll(); hud(); }
boot();
if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fitAll(); measureDash(); });
addEventListener("resize", fitAll, {passive:true});
