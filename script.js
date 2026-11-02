const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const nextCanvas=document.getElementById('nextCanvas'),nctx=nextCanvas.getContext('2d');
const COLS=10,ROWS=20,SIZE=30;
const SHAPES=[
 [[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]], 
 [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]]
];
const WORLDS=[
 {id:'overworld',name:'OVERWORLD',title:'Overworld',icon:'🌳',desc:'Bosques, montañas y cuevas.',blocks:['grass','dirt','stone','oak','sand','water','diamond','moss','deepslate','gold']},
 {id:'nether',name:'NETHER',title:'Nether',icon:'🔥',desc:'Lava, fortalezas y rocas antiguas.',blocks:['netherrack','magma','soul','quartz','glowstone','blackstone','basalt','crimson','warped','ancient']},
 {id:'end',name:'THE END',title:'The End',icon:'🐉',desc:'Islas del End y misteriosos cristales.',blocks:['endstone','purpur','obsidian','chorus','bedrock','amethyst','sculk','shulker','dragon','purpur2']}
];
const PALETTES={
 grass:['#65a83d','#477b2d'],dirt:['#95643e','#68452f'],stone:['#92999b','#62696b'],oak:['#a87943','#6f482a'],sand:['#e2d39a','#b8a66b'],water:['#438fc1','#28618c'],diamond:['#5de1d2','#299d9b'],moss:['#678a42','#405c2e'],deepslate:['#555b68','#353b47'],gold:['#f2c84b','#b98b25'],
 netherrack:['#a33e37','#702b2c'],magma:['#ed702d','#a63b21'],soul:['#477f8b','#2c5364'],quartz:['#e7d9c9','#a99a8b'],glowstone:['#e7a64b','#a96c32'],blackstone:['#55505a','#302d37'],basalt:['#77717b','#48434c'],crimson:['#a33a65','#692342'],warped:['#3e9b91','#23645f'],ancient:['#5c514a','#37312e'],
 endstone:['#d4d39b','#9d9b6d'],purpur:['#aa78bd','#714a87'],obsidian:['#41304f','#251d34'],chorus:['#8661a5','#513b6e'],bedrock:['#676575','#3d3c4b'],amethyst:['#c18bec','#8054a9'],sculk:['#286d72','#17464e'],shulker:['#9b76b7','#654a80'],dragon:['#5a4b73','#342c4b'],purpur2:['#c08ac9','#85578f']
};
let board,active,next,score=0,lines=0,pieces=0,level=1,worldIndex=0,paused=true,gameOver=false,lastTime=0,dropCounter=0,dropInterval=850;
const $=id=>document.getElementById(id);
function randomPiece(){const i=Math.floor(Math.random()*SHAPES.length),shape=SHAPES[i].map(r=>r.slice()),blocks=WORLDS[worldIndex].blocks;return {shape,x:Math.floor(COLS/2)-Math.ceil(shape[0].length/2),y:0,block:blocks[Math.floor(Math.random()*blocks.length)]};}
function reset(){board=Array.from({length:ROWS},()=>Array(COLS).fill(null));score=0;lines=0;pieces=0;level=1;worldIndex=0;dropInterval=850;active=randomPiece();next=randomPiece();paused=false;gameOver=false;dropCounter=0;updateUI();$('overlay').classList.add('hidden');$('statusText').textContent='EXPLORANDO OVERWORLD';draw();requestAnimationFrame(update);}
function color(block){return PALETTES[block]||['#aaa','#666'];}
const textureCache={};
function loadTexture(block){
 if(textureCache[block])return textureCache[block];
 const img=new Image();textureCache[block]=img;
 img.onload=()=>draw();
 img.onerror=()=>{textureCache[block]=null;draw();};
 img.src=`assets/textures/${block}.png`;
 return img;
}
Object.keys(PALETTES).forEach(loadTexture);
function collide(p){for(let y=0;y<p.shape.length;y++)for(let x=0;x<p.shape[y].length;x++)if(p.shape[y][x]){let nx=p.x+x,ny=p.y+y;if(nx<0||nx>=COLS||ny>=ROWS||(ny>=0&&board[ny][nx]))return true;}return false;}
function merge(){active.shape.forEach((r,y)=>r.forEach((v,x)=>{if(v&&active.y+y>=0)board[active.y+y][active.x+x]=active.block;}));}
function clearLines(){let count=0;outer:for(let y=ROWS-1;y>=0;y--){if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(COLS).fill(null));count++;y++;}}if(count){lines+=count;score+=[0,100,300,500,800][count]*level;level=1+Math.floor(score/500);dropInterval=Math.max(100,850-(level-1)*65);}}
function spawn(){active=next;active.x=Math.floor(COLS/2)-Math.ceil(active.shape[0].length/2);active.y=0;next=randomPiece();pieces++;if(collide(active)){gameOver=true;paused=true;$('overlayTitle').textContent='FIN DEL JUEGO';$('overlayText').textContent=`Conseguiste ${score} puntos y completaste ${lines} líneas.`;$('startBtn').textContent='VOLVER A JUGAR';$('overlay').classList.remove('hidden');$('statusText').textContent='MUNDO CONQUISTADO';}updateUI();}
function rotate(matrix){return matrix[0].map((_,i)=>matrix.map(row=>row[i]).reverse());}
function move(dx){if(paused||gameOver)return;active.x+=dx;if(collide(active))active.x-=dx;draw();}
function softDrop(){if(paused||gameOver)return;active.y++;if(collide(active)){active.y--;merge();clearLines();spawn();}dropCounter=0;updateUI();draw();}
function hardDrop(){if(paused||gameOver)return;while(!collide(active))active.y++;active.y--;merge();clearLines();spawn();dropCounter=0;draw();}
function turn(){if(paused||gameOver)return;const old=active.shape;active.shape=rotate(old);if(collide(active)){active.x++;if(collide(active)){active.x-=2;if(collide(active)){active.x++;active.shape=old;}}}draw();}
function switchWorld(){const idx=Math.min(2,Math.floor(score/500));if(idx!==worldIndex){worldIndex=idx;document.body.dataset.dimension=WORLDS[idx].id;active.block=WORLDS[idx].blocks[Math.floor(Math.random()*WORLDS[idx].blocks.length)];next.block=WORLDS[idx].blocks[Math.floor(Math.random()*WORLDS[idx].blocks.length)];$('statusText').textContent=`¡PORTAL ACTIVADO: ${WORLDS[idx].name}!`;}}
function updateUI(){switchWorld();$('score').textContent=score.toLocaleString('es-MX');$('lines').textContent=lines;$('pieces').textContent=pieces;$('level').textContent=level;$('speed').textContent=(850/dropInterval).toFixed(1)+'x';$('best').textContent=Math.max(score,Number(localStorage.getItem('mcTetrisBest')||0)).toLocaleString('es-MX');const progress=score%500;$('progress').style.width=(progress/5)+'%';$('progressText').textContent=worldIndex===2?'¡Has llegado a The End!':`${progress} / 500 pts para la siguiente dimensión`;$('dimensionName').textContent=WORLDS[worldIndex].name;$('dimensionTitle').textContent=WORLDS[worldIndex].title;$('dimensionIcon').textContent=WORLDS[worldIndex].icon;$('dimensionDesc').textContent=WORLDS[worldIndex].desc;drawNext();}
function drawBlock(c,x,y,size,block){
 const [base,shade]=color(block),img=textureCache[block];
 c.save();c.imageSmoothingEnabled=false;
 if(img&&img.complete&&img.naturalWidth){c.drawImage(img,x,y,size,size);}
 else{
  c.fillStyle=base;c.fillRect(x,y,size,size);
  c.fillStyle=shade;c.fillRect(x,y+size*.72,size,size*.28);c.fillRect(x+size*.72,y,size*.28,size);
  c.fillStyle='#ffffff30';c.fillRect(x+2,y+2,size-4,3);c.fillRect(x+2,y+2,3,size-4);
  c.fillStyle='#00000018';c.fillRect(x+size*.22,y+size*.25,size*.22,size*.18);c.fillRect(x+size*.58,y+size*.48,size*.2,size*.16);
 }
 // Borde sutil para separar cada cubo sin ocultar su textura.
 c.fillStyle='#ffffff18';c.fillRect(x,y,size,1);c.fillRect(x,y,1,size);
 c.fillStyle='#00000055';c.fillRect(x,y+size-1,size,1);c.fillRect(x+size-1,y,1,size);
 c.restore();
}
function draw(){if(!board)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=worldIndex===0?'#17251d':worldIndex===1?'#241317':'#171427';ctx.fillRect(0,0,300,600);ctx.strokeStyle='#ffffff0c';for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*SIZE,0);ctx.lineTo(x*SIZE,600);ctx.stroke();}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*SIZE);ctx.lineTo(300,y*SIZE);ctx.stroke();}board.forEach((r,y)=>r.forEach((b,x)=>{if(b)drawBlock(ctx,x*SIZE,y*SIZE,SIZE,b);}));if(active){active.shape.forEach((r,y)=>r.forEach((v,x)=>{if(v)drawBlock(ctx,(active.x+x)*SIZE,(active.y+y)*SIZE,SIZE,active.block);}));}}
function drawNext(){nctx.clearRect(0,0,132,112);if(!next)return;const s=24,w=next.shape[0].length*s,h=next.shape.length*s,ox=(132-w)/2,oy=(112-h)/2;next.shape.forEach((r,y)=>r.forEach((v,x)=>{if(v)drawBlock(nctx,ox+x*s,oy+y*s,s,next.block);}));}
function update(time=0){if(paused||gameOver)return;const delta=time-lastTime;lastTime=time;dropCounter+=delta;if(dropCounter>dropInterval)softDrop();draw();requestAnimationFrame(update);}
function togglePause(){if(gameOver)return;if(!board){reset();return;}paused=!paused;if(paused){$('overlayTitle').textContent='PAUSA';$('overlayText').textContent='Tómate un descanso, constructor.';$('startBtn').textContent='CONTINUAR';$('overlay').classList.remove('hidden');$('statusText').textContent='JUEGO EN PAUSA';}else{$('overlay').classList.add('hidden');$('statusText').textContent='EN PARTIDA';lastTime=performance.now();requestAnimationFrame(update);}}
document.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='ArrowDown')softDrop();if(e.key==='ArrowUp')turn();if(e.key===' ')hardDrop();if(e.key.toLowerCase()==='p')togglePause();});
document.querySelectorAll('[data-action]').forEach(b=>{const act=()=>({left:()=>move(-1),right:()=>move(1),down:softDrop,rotate:turn,drop:hardDrop}[b.dataset.action])();b.addEventListener('click',act);});
$('startBtn').addEventListener('click',()=>{if(gameOver||!board)reset();else if(paused)togglePause();});
$('pauseBtn').addEventListener('click',togglePause);$('restartBtn').addEventListener('click',reset);
$('best').textContent=Number(localStorage.getItem('mcTetrisBest')||0).toLocaleString('es-MX');
const originalUpdateUI=updateUI;updateUI=function(){originalUpdateUI();if(score>Number(localStorage.getItem('mcTetrisBest')||0))localStorage.setItem('mcTetrisBest',score);};
board=Array.from({length:ROWS},()=>Array(COLS).fill(null));active=randomPiece();next=randomPiece();draw();drawNext();
