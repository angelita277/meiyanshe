// Fit a local constrained landmark model, then clip the original pixels to the contour.
const sourceCanvas=document.createElement("canvas");
let points=[],draft=[],fitGeneration=0,fitPending=false,faceReady=false,placement={x:0,y:0};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
let cropConfirmed = false;
function resetFace(){
 cropConfirmed=false;
 fitGeneration++;fitPending=false;faceReady=false;points=[];
 placement={x:0,y:0};$("scale").value=100;$("face").width=1;
}
function oval(cx,cy,rx,ry){
 return Array.from({length:14},(_,i)=>{const a=(i/14)*Math.PI*2;return [cx+rx*Math.cos(a),cy+ry*Math.sin(a)]});
}
async function landmarks(canvas){
 const preview=document.createElement("canvas"),ratio=360/Math.max(canvas.width,canvas.height);
 preview.width=Math.max(1,Math.round(canvas.width*ratio));preview.height=Math.max(1,Math.round(canvas.height*ratio));
 preview.getContext("2d").drawImage(canvas,0,0,preview.width,preview.height);
 const tracker=new clm.tracker({useWebGL:false});tracker.init();
 try{
  tracker.start(preview);
  for(let n=0;n<25;n++){
   await new Promise(done=>setTimeout(done,90));
   const p=tracker.getCurrentPosition();
   if(!p||tracker.getConvergence()>3||tracker.getScore()<0.32)continue;
   const jaw=[0,2,4,6,7,8,10,12,14].map(j=>p[j].slice());
   const [l,r]=[jaw[0],jaw.at(-1)],w=r[0]-l[0],mid=(r[0]+l[0])/2,top=(l[1]+r[1])/2;
   if(w<10)continue;
   // Start outside the temples so the wearer can keep the sides and crown of the hairstyle.
   const chin=jaw[4][1];
   return [[mid,chin+w*.04],[mid+w*.28,chin],[mid+w*.58,chin-w*.04],[mid+w*.67,top+w*.1],[mid+w*.62,top-w*.42],[mid+w*.39,top-w*.76],[mid,top-w*.90],[mid-w*.39,top-w*.76],[mid-w*.62,top-w*.42],[mid-w*.67,top+w*.1],[mid-w*.58,chin-w*.04],[mid-w*.28,chin]].map(([x,y])=>[clamp(x/preview.width,0,1),clamp(y/preview.height,0,1)]);
  }
 }finally{tracker.stop()}
 return null;
}
async function ensureFace(){
 if(!sourceUrl)return;
 if(faceReady){openEditor();return}
 if(fitPending)return;
 fitPending=true;const version=fitGeneration,img=$("portrait");
 try{
  await img.decode();if(version!==fitGeneration)return;
  const factor=Math.min(1,1000/Math.max(img.naturalWidth,img.naturalHeight));
  sourceCanvas.width=Math.max(1,Math.round(img.naturalWidth*factor));sourceCanvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
  sourceCanvas.getContext("2d").drawImage(img,0,0,sourceCanvas.width,sourceCanvas.height);
  let contour;
  notify("正在本机定位头部轮廓…");
  try { contour=await landmarks(sourceCanvas); } catch {}
  if(version!==fitGeneration)return;
  points=contour||oval(.5,.43,.2,Math.min(.35,.26*sourceCanvas.width/sourceCanvas.height));
  faceReady=true;
  openEditor();
 }catch{notify("照片读取失败，请重新选择照片")}finally{if(version===fitGeneration)fitPending=false}
}
function smoothPath(ctx,coords){
 const last=coords.at(-1),first=coords[0];ctx.beginPath();ctx.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
 coords.forEach(([x,y],i)=>{const n=coords[(i+1)%coords.length];ctx.quadraticCurveTo(x,y,(x+n[0])/2,(y+n[1])/2)});ctx.closePath();
}
function renderCutout(){
 const coords=points.map(([x,y])=>[x*sourceCanvas.width,y*sourceCanvas.height]);
 const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys);
 const face=$("face");face.width=Math.max(1,Math.ceil(Math.max(...xs)-left));face.height=Math.max(1,Math.ceil(Math.max(...ys)-top));
 const ctx=face.getContext("2d");ctx.save();ctx.translate(-left,-top);smoothPath(ctx,coords);ctx.clip();ctx.drawImage(sourceCanvas,0,0);ctx.restore();
 let rgb=[184,141,118];
 try{
  const samples=[];
  for (const x of [.32,.38,.58,.65]) {
   for (const y of [.55,.60,.66]) {
    const pixel=ctx.getImageData(Math.floor(face.width*x),Math.floor(face.height*y),1,1).data;
    if(pixel[3]>245)samples.push(Array.from(pixel).slice(0,3));
   }
  }
  samples.sort((a,b)=>(a[0]+2*a[1]+a[2])-(b[0]+2*b[1]+b[2]));
  if(samples.length)rgb=samples[Math.floor(samples.length*.62)];
 }catch{}
 $("neck").style.setProperty("--skin",rgb.join(","));
 placeFace();
}
function placeFace(){
 // Each opening is traced on its own garment. Offsets are relative to the fitted face.
 const collars=[
  "46% 34%,56% 34%,57% 40%,60% 43%,59% 52%,55% 65%,52% 76%,47% 64%,43% 52%,43% 43%,46% 40%",
  "46% 34%,56% 34%,57% 41%,60% 43%,59% 54%,55% 67%,52% 78%,46% 65%,42% 52%,43% 43%,46% 40%",
  "46% 29%,55% 29%,56% 35%,58% 36%,57% 41%,54% 44%,49% 45%,44% 43%,43% 39%,43% 36%,46% 34%",
  "45% 29%,56% 29%,56% 35%,59% 37%,58% 47%,55% 55%,53% 63%,49% 55%,46% 50%,43% 40%,44% 36%,45% 34%"
 ];
 $("neck").style.clipPath="polygon("+collars[index]+")";
 const face=$("face"), upper=index<2;
 face.style.height=(Number($("scale").value)*(upper?.465:.405))+"%";
 face.style.left=(51+placement.x)+"%";
 face.style.top=((upper?25.5:22)+placement.y)+"%";
}
function editDraw(){
 const canvas=$("maskEdit"),ctx=canvas.getContext("2d");
 const w=canvas.width,h=canvas.height;ctx.drawImage(sourceCanvas,0,0,w,h);
 const coords=draft.map(([x,y])=>[x*w,y*h]);smoothPath(ctx,coords);ctx.strokeStyle="rgb(243, 224, 211)";ctx.lineWidth=w/170;ctx.stroke();
 coords.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,w/75,0,2*Math.PI);ctx.fillStyle="rgb(250, 246, 242)";ctx.fill();ctx.strokeStyle="rgb(86, 70, 82)";ctx.lineWidth=w/300;ctx.stroke()});
}
function openEditor(){
 if(!faceReady){notify("正在准备照片，请稍候");return}
 draft=points.map(p=>[...p]);const c=$("maskEdit");c.width=sourceCanvas.width;c.height=sourceCanvas.height;
 c.style.width="min(100%, "+(52*c.width/c.height)+"vh)";c.style.maxHeight="none";$("editor").showModal();editDraw();
}
document.addEventListener("DOMContentLoaded",()=>{
 $("outline").onclick=openEditor;$("scale").oninput=placeFace;
 $("saveEdit").onclick=()=>{points=draft;cropConfirmed=true;renderCutout();refreshOutfit();$("editor").close()};
 $("cancelEdit").onclick=()=>$("editor").close();
 $("editor").addEventListener("close",()=>{refreshOutfit()});
 const edit=$("maskEdit"),face=$("face");let active=-1,drag=null;
 function xy(e){const r=edit.getBoundingClientRect();return [clamp((e.clientX-r.left)/r.width,0,1),clamp((e.clientY-r.top)/r.height,0,1)]}
 edit.onpointerdown=e=>{const [x,y]=xy(e);let best=Infinity;draft.forEach(([px,py],i)=>{const d=Math.hypot((px-x)*edit.width,(py-y)*edit.height);if(d<best){best=d;active=i}});edit.setPointerCapture(e.pointerId)};
 edit.onpointermove=e=>{if(active>=0){const next=xy(e);if(Math.hypot(next[0]-draft[active][0],next[1]-draft[active][1])>.002){draft[active]=next;editDraw()}}};
 edit.onlostpointercapture=()=>active=-1;
 face.onpointerdown=e=>{drag=[e.clientX,e.clientY,placement.x,placement.y];face.setPointerCapture(e.pointerId)};
 face.onpointermove=e=>{if(!drag)return;const r=$("fittingPlane").getBoundingClientRect();placement={x:clamp(drag[2]+(e.clientX-drag[0])*100/r.width,-45,45),y:clamp(drag[3]+(e.clientY-drag[1])*100/r.height,-22,60)};placeFace()};
 face.onlostpointercapture=()=>drag=null;
});
