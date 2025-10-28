(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highscore');
  const restartBtn = document.getElementById('restart');
  const easyBtn = document.getElementById('easy');
  const mediumBtn = document.getElementById('medium');
  const hardBtn = document.getElementById('hard');

  let gridSize = 30;
  let cellSize;
  let speed = 8;

  let snake = [{x:15, y:15}];
  let dir = {x:0, y:0};
  let nextDir = {x:0, y:0};
  let food = {x:10, y:10};
  let obstacles = [];
  let lastFrameTime = 0;
  let score = 0;
  let highscore = Number(localStorage.getItem('snake_highscore') || 0);
  let paused = false;

  scoreEl.textContent = score;
  highScoreEl.textContent = highscore;

  function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.95, 600);
    canvas.width = size;
    canvas.height = size;
    cellSize = canvas.width / gridSize;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function placeFood() {
    while(true){
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      if(!snake.some(s => s.x===x && s.y===y) &&
         !obstacles.some(o => o.x===x && o.y===y)){
        food = {x,y};
        return;
      }
    }
  }

  function generateObstacles(count) {
    obstacles = [];
    while(obstacles.length < count){
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      if(!snake.some(s => s.x===x && s.y===y) &&
         !(food.x===x && food.y===y) &&
         !obstacles.some(o => o.x===x && o.y===y)){
        obstacles.push({x,y});
      }
    }
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Food
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(food.x*cellSize + cellSize/2, food.y*cellSize + cellSize/2, cellSize/2.5, 0, Math.PI*2);
    ctx.fill();

    // Obstacles
    ctx.fillStyle = '#ff5555';
    obstacles.forEach(o => ctx.fillRect(o.x*cellSize+1, o.y*cellSize+1, cellSize-2, cellSize-2));

    // Snake
    snake.forEach((s,i) => {
      ctx.fillStyle = i===0 ? '#86efac' : '#60a86b';
      ctx.beginPath();
      ctx.arc(s.x*cellSize + cellSize/2, s.y*cellSize + cellSize/2, cellSize/2.2, 0, Math.PI*2);
      ctx.fill();
    });
  }

  function update() {
    if(nextDir.x !== -dir.x || nextDir.y !== -dir.y) dir = nextDir.x||nextDir.y ? nextDir : dir;
    if(dir.x===0 && dir.y===0) return;

    const head = {x:snake[0].x + dir.x, y:snake[0].y + dir.y};

    if(head.x < 0) head.x = gridSize-1;
    if(head.x >= gridSize) head.x = 0;
    if(head.y < 0) head.y = gridSize-1;
    if(head.y >= gridSize) head.y = 0;

    if(snake.some(s=>s.x===head.x && s.y===head.y) || obstacles.some(o=>o.x===head.x && o.y===head.y)){
      reset(false);
      return;
    }

    snake.unshift(head);

    if(head.x===food.x && head.y===food.y){
      score += 1;
      scoreEl.textContent = score;
      placeFood();
      if(score>highscore){
        highscore=score;
        localStorage.setItem('snake_highscore',highscore);
        highScoreEl.textContent=highscore;
      }
    } else snake.pop();
  }

  function gameLoop(timestamp) {
    if(paused){ requestAnimationFrame(gameLoop); return; }
    const secondsPerFrame = 1/speed;
    if(!lastFrameTime) lastFrameTime = timestamp;
    const delta = (timestamp - lastFrameTime)/1000;
    if(delta > secondsPerFrame){ update(); draw(); lastFrameTime = timestamp; }
    requestAnimationFrame(gameLoop);
  }

  function reset(wipeScore=true){
    snake = [{x:Math.floor(gridSize/2), y:Math.floor(gridSize/2)}];
    dir={x:0,y:0}; nextDir={x:0,y:0};
    if(wipeScore){score=0; scoreEl.textContent=score;}
    placeFood();
  }

  function setDifficulty(spd, grid, obsCount){
    speed = spd; gridSize = grid; cellSize = canvas.width/gridSize;
    generateObstacles(obsCount);
    [easyBtn, mediumBtn, hardBtn].forEach(b=>b.classList.remove('active'));
    if(spd===6) easyBtn.classList.add('active');
    if(spd===8) mediumBtn.classList.add('active');
    if(spd===12) hardBtn.classList.add('active');
    reset(true);
  }

  window.addEventListener('keydown', e=>{
    const key=e.key;
    if(key==='ArrowUp'||key==='w'||key==='W') nextDir={x:0,y:-1};
    if(key==='ArrowDown'||key==='s'||key==='S') nextDir={x:0,y:1};
    if(key==='ArrowLeft'||key==='a'||key==='A') nextDir={x:-1,y:0};
    if(key==='ArrowRight'||key==='d'||key==='D') nextDir={x:1,y:0};
    if(key===' ') paused=!paused;
  });

  // Mobile swipe
  let touchStart = null;
  canvas.addEventListener('touchstart', e=>{ touchStart=e.touches[0]; });
  canvas.addEventListener('touchend', e=>{
    if(!touchStart) return;
    const t=e.changedTouches[0];
    const dx=t.clientX-touchStart.clientX;
    const dy=t.clientY-touchStart.clientY;
    if(Math.abs(dx)>Math.abs(dy)){
      if(dx>10) nextDir={x:1,y:0};
      else if(dx<-10) nextDir={x:-1,y:0};
    } else {
      if(dy>10) nextDir={x:0,y:1};
      else if(dy<-10) nextDir={x:0,y:-1};
    }
    touchStart=null;
  });

  restartBtn.addEventListener('click', ()=>{ reset(true); paused=false; });
  easyBtn.addEventListener('click', ()=>{ setDifficulty(6,30,0); });
  mediumBtn.addEventListener('click', ()=>{ setDifficulty(8,30,15); });
  hardBtn.addEventListener('click', ()=>{ setDifficulty(12,30,30); });

  placeFood();
  reset(true);
  requestAnimationFrame(gameLoop);
})();
