const $ = id => document.getElementById(id);
const palettes = [
 {en:"Spring",cn:"明媚春季",icon:"✿",tags:["暖色调","明亮","清透"],desc:"暖而明亮，代表色是珊瑚粉和嫩芽绿。",names:["珊瑚粉","蜜桃橙","奶油黄","嫩芽绿","湖水绿"],colors:["#ef8a7c","#f9b389","#f7dc86","#adcb82","#76baa6"]},
 {en:"Summer",cn:"柔雾夏季",icon:"❀",tags:["冷色调","柔和","轻盈"],desc:"冷而柔和，代表色是雾玫瑰和柔雾蓝。",names:["雾玫瑰","藕粉","薰衣草","柔雾蓝","鼠尾草"],colors:["#c290a6","#d9b3bd","#afa5c8","#97b4ce","#a3b9b3"]},
 {en:"Autumn",cn:"醇暖秋季",icon:"❦",tags:["暖色调","浓郁","沉稳"],desc:"温暖浓郁，代表色是陶土红和橄榄绿。",names:["陶土红","肉桂棕","芥末金","橄榄绿","深苔绿"],colors:["#ba6647","#995f42","#c59a42","#90945b","#596d4b"]},
 {en:"Winter",cn:"凛冽冬季",icon:"❄",tags:["冷色调","鲜明","高对比"],desc:"冷调鲜明，代表色是宝石蓝和莓果红。",names:["莓果红","洋红","宝石蓝","祖母绿","冰晶蓝"],colors:["#ac2048","#bd377c","#2346a0","#08705f","#c8e9f4"]}
];
let index=0, sourceUrl="", noticeTimer;
function notify(message){$("notice").textContent=message;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$("notice").textContent="",4500)}
function selectSeason(i){
 index=i;const p=palettes[i];
 $("name").textContent=p.cn;$("english").textContent=p.en.toUpperCase()+" PALETTE";$("plate").textContent=p.en;
 $("symbol").textContent=p.icon;$("description").textContent=p.desc;
 $("tags").innerHTML=p.tags.map(s=>'<span>'+s+'</span>').join("");
 $("swatches").innerHTML=p.colors.map((c,j)=>'<div class="swatch"><i style="background:'+c+'"></i>'+p.names[j]+'</div>').join("");
 $("dots").innerHTML=p.colors.map(c=>'<i style="background:'+c+'"></i>').join("");
 $("example").src=p.en.toLowerCase()+"-example.jpg";
 $("example").alt=p.cn+"穿搭示例，模特保留完整发型";
 $("look").style.setProperty("--headroom", "url("+p.en.toLowerCase()+"-headroom.webp)");
 $("look").style.backgroundImage="url("+p.en.toLowerCase()+"-layered.jpg)";
 document.querySelectorAll(".choice").forEach((button,j)=>{button.setAttribute("aria-pressed",j===i);button.querySelector(".check").hidden=i!==j});
 $("paletteTitle").textContent=p.cn.slice(2)+"色卡";
 if(cropConfirmed) placeFace();
}
palettes.forEach((p,i)=>{const b=document.createElement("button");b.className="choice";b.innerHTML='<strong>'+p.cn.slice(2)+'</strong><em>'+p.en+'</em><span class="check">✓</span><span class="ribbon">'+p.colors.map(c=>'<i style="background:'+c+'"></i>').join("")+'</span>';b.onclick=()=>selectSeason(i);$("choices").append(b)});
selectSeason(0);
function refreshOutfit() {
 $("look").hidden = !cropConfirmed;
 const sample = !sourceUrl && !cropConfirmed;
 $("example").hidden = !sample;
 $("portrait").hidden = cropConfirmed || sample;
 $("startCut").hidden = !sourceUrl || cropConfirmed;
 document.querySelector(".fit").hidden = !cropConfirmed;
 $("canvas").classList.toggle("outfit", cropConfirmed);
 if (cropConfirmed) placeFace();
}
$("startCut").onclick = ensureFace;
