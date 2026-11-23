let photoSelection = 0;
$("upload").onclick = () => $("file").click();
$("file").onchange = async event => {
 const file = event.target.files[0];
 event.target.value = "";
 if (!file) return;
 const selection = ++photoSelection;
 const url = URL.createObjectURL(file);
 const photo = new Image();
 photo.src = url;
 try {
  await photo.decode();
 } catch {
  URL.revokeObjectURL(url);
  if (selection === photoSelection) notify("照片无法读取，请选择 JPG、PNG 或 WebP 照片。");
  return;
 }
 if (selection !== photoSelection) {
  URL.revokeObjectURL(url);
  return;
 }
 const previousUrl = sourceUrl;
 photo.id = "portrait";
 photo.alt = "用于圈选头部的我的照片";
 $("portrait").replaceWith(photo);
 sourceUrl = url;
 if (previousUrl) URL.revokeObjectURL(previousUrl);
 resetFace();
 refreshOutfit();
 $("upload").lastChild.textContent = "更换照片";
 $("sample").textContent = "我的照片";
 $("canvas").scrollIntoView({block:"center"});
 await ensureFace();
};
