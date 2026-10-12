'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('mazeCanvas');
  const ctx = canvas.getContext('2d');
  const MAX_LEVEL = 12;
  const BEST_KEY = 'magicMazeBestScoreV1';
  const SOUND_KEY = 'magicMazeSoundV1';
  const levelNames = ['Khu vườn đầu tiên','Con đường hoa','Rừng kẹo ngọt','Hồ mây tím','Cánh đồng sao','Lối đi cầu vồng','Vườn bướm','Rừng ánh trăng','Lâu đài bí mật','Mê cung ngọc','Giấc mơ thần tiên','Cổng vườn kỳ diệu'];
  let level = 1, score = 0, steps = 0, elapsed = 0, startedAt = 0, running = false, completed = false;
  let grid = [], size = 9, player = {x:1,y:1}, visual = {x:1,y:1}, exit = {x:1,y:1}, key = null, stars = [], hasKey = false, collected = 0;
  let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'off';
  let best = Number(localStorage.getItem(BEST_KEY)) || 0;
  let audioCtx = null, lastMove = 0, messageTimeout = null, previousFrame = 0;
  let touchStart = null;
  const rand = n => Math.floor(Math.random()*n);
  const shuffle = arr => { for(let i=arr.length-1;i>0;i--){const j=rand(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr; };
  const same = (a,b) => a && b && a.x===b.x && a.y===b.y;
  const formatTime = t => `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
  const getName = () => {try{return localStorage.getItem('quizUserName')?.trim() || 'Bạn';}catch{return 'Bạn';}};
  document.querySelectorAll('.displayUserName').forEach(el=>el.textContent=getName());
  $('bestText').textContent = best.toLocaleString('vi-VN');
  function tone(freq=550,duration=.12,type='sine',volume=.065){
    if(!soundEnabled) return;
    try {
      audioCtx ??= new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended') audioCtx.resume();
      const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),now=audioCtx.currentTime;
      osc.type=type;osc.frequency.setValueAtTime(freq,now);
      gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
      osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+duration);
    }catch(e){console.warn('Audio unavailable:',e);}
  }
  function fanfare(){[523,659,784,1046].forEach((n,i)=>setTimeout(()=>tone(n,.25,'sine',.09),i*115));}
  function notify(msg){const el=$('floatingMessage');el.textContent=msg;el.classList.add('show');clearTimeout(messageTimeout);messageTimeout=setTimeout(()=>el.classList.remove('show'),1300);}
  function generateMaze(n){
    const m=Array.from({length:n},()=>Array(n).fill(1));
    const stack=[[1,1]];m[1][1]=0;
    while(stack.length){
      const [x,y]=stack[stack.length-1];
      const neighbors=shuffle([[2,0],[-2,0],[0,2],[0,-2]])
        .map(([dx,dy])=>[x+dx,y+dy,dx,dy])
        .filter(([nx,ny])=>nx>0&&ny>0&&nx<n-1&&ny<n-1&&m[ny][nx]===1);
      if(!neighbors.length){stack.pop();continue;}
      const [nx,ny,dx,dy]=neighbors[0];m[y+dy/2][x+dx/2]=0;m[ny][nx]=0;stack.push([nx,ny]);
    }
    // Add a few shortcuts in advanced levels.
    const shortcuts=Math.max(0,level-3);
    for(let i=0;i<shortcuts;i++){
      const candidates=[];
      for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
        if(m[y][x]!==1)continue;
        if((m[y][x-1]===0&&m[y][x+1]===0)||(m[y-1][x]===0&&m[y+1][x]===0))candidates.push([x,y]);
      }
      if(candidates.length){const [x,y]=candidates[rand(candidates.length)];m[y][x]=0;}
    }
    return m;
  }
  function distances(start){
    const dist=Array.from({length:size},()=>Array(size).fill(-1));
    const queue=[start];dist[start.y][start.x]=0;
    for(let i=0;i<queue.length;i++){
      const {x,y}=queue[i];
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy;
        if(nx>=0&&ny>=0&&nx<size&&ny<size&&grid[ny][nx]===0&&dist[ny][nx]===-1){dist[ny][nx]=dist[y][x]+1;queue.push({x:nx,y:ny});}
      }
    }
    return dist;
  }
  function placeItems(){
    const dist=distances(player);
    const options=[];
    for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++)if(grid[y][x]===0&&dist[y][x]>0)options.push({x,y,d:dist[y][x]});
    options.sort((a,b)=>b.d-a.d);
    exit={x:options[0].x,y:options[0].y};
    const keyCandidates=options.filter(p=>p.d>=Math.max(4,Math.floor(options[0].d*.45))&&!same(p,exit));
    const chosenKey=keyCandidates[rand(keyCandidates.length)]||options.find(p=>!same(p,exit));
    key={x:chosenKey.x,y:chosenKey.y};
    const free=shuffle(options.filter(p=>!same(p,key)&&!same(p,exit)&&p.d>1));
    stars=free.slice(0,3+Math.floor((level-1)/4)).map(p=>({x:p.x,y:p.y,got:false}));
  }
  function updateUI(){
    $('levelText').textContent=`${level} / ${MAX_LEVEL}`;
    $('levelName').textContent=levelNames[level-1];
    $('scoreText').textContent=score.toLocaleString('vi-VN');
    $('bestText').textContent=best.toLocaleString('vi-VN');
    $('stepsText').textContent=steps;
    $('starStatus').textContent=`${collected} / ${stars.length}`;
    $('keyStatus').textContent=hasKey?'Đã tìm thấy!':'Chưa tìm thấy';
    $('keyBadge').textContent=hasKey?'🗝️ Đã có chìa':'🗝️ Chưa có chìa';
    $('keyBadge').classList.toggle('has-key',hasKey);
    $('progressText').textContent=`Màn ${level}/${MAX_LEVEL}`;
    $('progressFill').style.width=`${level/MAX_LEVEL*100}%`;
    $('objectiveText').textContent=hasKey?'Tới cánh cửa màu hồng để qua màn!':'Nhặt chìa khóa để mở cửa!';
    $('timeText').textContent=formatTime(elapsed);
  }
  function startLevel(resetScore=false){
    if(resetScore){score=0;level=1;}
    size=Math.min(19,9+2*Math.floor((level-1)/2));
    grid=generateMaze(size);player={x:1,y:1};visual={x:1,y:1};
    hasKey=false;collected=0;steps=0;elapsed=0;startedAt=performance.now();running=true;completed=false;
    placeItems();$('overlay').classList.add('hidden');updateUI();notify(`🌸 Màn ${level} bắt đầu!`);
  }
  function move(dx,dy){
    if(!running||completed||!$('overlay').classList.contains('hidden'))return;
    const now=performance.now();if(now-lastMove<95)return;lastMove=now;
    const nx=player.x+dx,ny=player.y+dy;
    if(nx<0||ny<0||nx>=size||ny>=size||grid[ny][nx]===1){tone(190,.06,'sine',.018);return;}
    player.x=nx;player.y=ny;steps++;tone(330,.035,'sine',.023);
    if(key&&same(player,key)){hasKey=true;key=null;score+=50;notify('🗝️ Đã tìm thấy chìa khóa!');tone(660,.2);}
    for(const star of stars){if(!star.got&&same(player,star)){star.got=true;collected++;score+=20;notify('⭐ +20 điểm!');tone(880,.16);}}
    if(same(player,exit)){
      if(hasKey)finishLevel();else{notify('🔒 Hãy tìm chìa khóa trước!');tone(210,.18,'triangle');}
    }
    updateUI();
  }
  function finishLevel(){
    if(completed)return;
    completed=true;running=false;
    const timeBonus=Math.max(10,150-elapsed*2),stepBonus=Math.max(0,80-steps);
    const reward=100+timeBonus+stepBonus;score+=reward;
    if(score>best){best=score;localStorage.setItem(BEST_KEY,String(best));}
    updateUI();fanfare();
    const final=level===MAX_LEVEL;
    $('modalEmoji').textContent=final?'🏆':'🎉';
    $('modalTitle').textContent=final?'Bạn là nhà thám hiểm xuất sắc!':'Qua màn thành công!';
    $('modalDescription').textContent=final?`${getName()} đã vượt qua cả ${MAX_LEVEL} mê cung!`:'Thỏ con đã tìm thấy lối ra. Tiếp tục hành trình nào!';
    $('modalSummary').textContent=`⭐ ${collected}/${stars.length} sao  •  👣 ${steps} bước  •  ⏱️ ${formatTime(elapsed)}  •  +${reward} điểm`;
    $('nextBtn').textContent=final?'🔄 Chơi từ đầu':'Màn tiếp theo →';
    $('overlay').classList.remove('hidden');
  }
  function drawRoundRect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function drawEmoji(emoji,x,y,fontSize){ctx.font=`${fontSize}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(emoji,x,y);}
  function render(t){
    const dt=Math.min(40,t-previousFrame||16);previousFrame=t;
    if(running){const current=Math.floor((t-startedAt)/1000);if(current!==elapsed){elapsed=current;$('timeText').textContent=formatTime(elapsed);}}
    visual.x+=(player.x-visual.x)*Math.min(1,dt*.018);visual.y+=(player.y-visual.y)*Math.min(1,dt*.018);
    const cell=600/size;ctx.clearRect(0,0,600,600);
    ctx.fillStyle='#faf7ff';ctx.fillRect(0,0,600,600);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      if(grid[y][x]===1){drawRoundRect(x*cell+.6,y*cell+.6,cell-1.2,cell-1.2,Math.max(2,cell*.14),'#d9c9f5');
        drawRoundRect(x*cell+cell*.14,y*cell+cell*.12,cell*.72,cell*.17,cell*.1,'#e9dfff');}
      else if((x+y)%2===0){drawRoundRect(x*cell+cell*.38,y*cell+cell*.38,cell*.24,cell*.24,cell*.12,'#f1ebfb');}
    }
    const bob=Math.sin(t*.004)*cell*.06;
    drawRoundRect(exit.x*cell+cell*.17,exit.y*cell+cell*.12,cell*.66,cell*.79,cell*.17,hasKey?'#ffc1d9':'#d8d1df');
    drawEmoji(hasKey?'🚪':'🔒',(exit.x+.5)*cell,(exit.y+.51)*cell,cell*.65);
    if(key)drawEmoji('🗝️',(key.x+.5)*cell,(key.y+.5)*cell+bob,cell*.67);
    for(const star of stars)if(!star.got)drawEmoji('⭐',(star.x+.5)*cell,(star.y+.5)*cell+bob,cell*.65);
    const px=(visual.x+.5)*cell,py=(visual.y+.5)*cell+Math.sin(t*.007)*cell*.035;
    ctx.fillStyle='#9c7bc229';ctx.beginPath();ctx.ellipse(px,py+cell*.25,cell*.33,cell*.12,0,0,Math.PI*2);ctx.fill();
    drawEmoji('🐰',px,py,cell*.86);
    requestAnimationFrame(render);
  }
  const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
  document.addEventListener('keydown',e=>{const dir=dirs[e.key]||dirs[e.key.toLowerCase()];if(!dir)return;e.preventDefault();move(...dir);});
  document.querySelectorAll('[data-dir]').forEach(btn=>{
    const map={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
    btn.addEventListener('pointerdown',e=>{e.preventDefault();move(...map[btn.dataset.dir]);});
  });
  canvas.addEventListener('touchstart',e=>{const touch=e.changedTouches[0];touchStart={x:touch.clientX,y:touch.clientY};},{passive:true});
  canvas.addEventListener('touchend',e=>{if(!touchStart)return;const touch=e.changedTouches[0],dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;if(Math.abs(dx)>Math.abs(dy))move(Math.sign(dx),0);else move(0,Math.sign(dy));},{passive:true});
  $('restartBtn').addEventListener('click',()=>startLevel());
  $('modalRestartBtn').addEventListener('click',()=>startLevel());
  $('nextBtn').addEventListener('click',()=>{if(level===MAX_LEVEL)startLevel(true);else{level++;startLevel();}});
  function updateSoundButton(){$('soundBtn').textContent=soundEnabled?'🔊 Âm thanh: Bật':'🔇 Âm thanh: Tắt';$('soundBtn').setAttribute('aria-pressed',String(soundEnabled));}
  $('soundBtn').addEventListener('click',()=>{soundEnabled=!soundEnabled;localStorage.setItem(SOUND_KEY,soundEnabled?'on':'off');updateSoundButton();if(soundEnabled)tone(660,.12);});
  updateSoundButton();startLevel();requestAnimationFrame(render);
})();
