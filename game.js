// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // fondo cielo para evitar pantalla negra

// Cámara
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Render
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb, 1);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '0';
document.body.appendChild(renderer.domElement);

// Fondo de escena y helpers para depuración
scene.background = new THREE.Color(0x87ceeb);
const grid = new THREE.GridHelper(200, 20, 0x444444, 0x888888);
scene.add(grid);
const axes = new THREE.AxesHelper(5);
scene.add(axes);

// Sliding (tecla C)
let isSliding = false;
let slideTime = 0;

// Menú (tecla M)
let menuVisible = false;
const menuDiv = document.createElement('div');
menuDiv.style.position = 'fixed';
menuDiv.style.top = '50%';
menuDiv.style.left = '50%';
menuDiv.style.transform = 'translate(-50%, -50%)';
menuDiv.style.width = '260px';
menuDiv.style.backgroundColor = 'rgba(0, 0, 51, 0.95)';
menuDiv.style.border = '2px solid #ffffff';
menuDiv.style.borderRadius = '12px';
menuDiv.style.display = 'none';
menuDiv.style.zIndex = '9999';
menuDiv.style.pointerEvents = 'auto';
menuDiv.style.padding = '16px';
menuDiv.style.color = '#fff';
menuDiv.style.fontFamily = 'Arial, sans-serif';
menuDiv.style.userSelect = 'none';
menuDiv.innerHTML = `
  <h3 style="margin-top:0; text-align:center;">Menú</h3>
  <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
    <button id="btnNem" style="background:#0066cc; color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer;">Habilidad NEM</button>
    <button id="btnLic" style="background:#009966; color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer;">Licencia</button>
    <button id="btnCont" style="background:#cc6600; color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer;">Contratos</button>
  </div>
  <p style="text-align:center; margin: 12px 0 0; font-size: 12px; opacity: 0.8;">Presiona M para cerrar</p>
`;
document.body.appendChild(menuDiv);

const nemHexOverlay = document.createElement('div');
nemHexOverlay.id = 'nemHexOverlay';
nemHexOverlay.style.position = 'fixed';
nemHexOverlay.style.top = '50%';
nemHexOverlay.style.left = '50%';
nemHexOverlay.style.transform = 'translate(-50%, -50%)';
nemHexOverlay.style.width = '70vw';
nemHexOverlay.style.height = '70vh';
nemHexOverlay.style.background = 'rgba(0, 0, 0, 0.65)';
nemHexOverlay.style.border = '2px solid #fff';
nemHexOverlay.style.borderRadius = '16px';
nemHexOverlay.style.display = 'none';
nemHexOverlay.style.zIndex = '10000';
nemHexOverlay.style.pointerEvents = 'auto';
nemHexOverlay.style.padding = '12px';
nemHexOverlay.style.color = '#fff';
nemHexOverlay.style.fontFamily = 'Arial, sans-serif';
nemHexOverlay.innerHTML = `
  <div style="display:flex; justify-content:center; margin-bottom:10px;">
    <button id="closeNem" style="padding:6px 12px; border:none; border-radius:6px; cursor:pointer;">Cerrar</button>
  </div>
  <div style="position:relative; width:100%; height:60vh; display:flex; align-items:center; justify-content:center;">
    <div id="hexagon-bg" style="position:absolute; width:50vh; height:50vh; max-width:80vw; max-height:80vh; clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%); background:rgba(25,25,110,0.7); border:4px solid #66f; border-radius:12px;"></div>
    <div style="position:absolute; width:60vh; height:60vh; max-width:90vw; max-height:90vh;">
      <span id="intensificacion" style="position:absolute; left:50%; top:-5%; transform:translate(-50%, 0); background:#0055aa; padding:8px 10px; border-radius:5px; cursor:pointer;" onclick="toggleDesc('desc-intensificacion')">Intensificación</span>
      <div id="desc-intensificacion" style="position:absolute; left:50%; top:3%; transform:translate(-50%, 0); background:#fff; color:#000; padding:8px; border-radius:5px; display:none; z-index:10001; max-width:200px;">Permite aumentar la fuerza, velocidad o resistencia de uno mismo o de objetos.</div>
      
      <span id="transmutacion" style="position:absolute; left:98%; top:20%; transform:translate(-50%, -50%); background:#009999; padding:8px 10px; border-radius:5px; cursor:pointer;" onclick="toggleDesc('desc-transmutacion')">Transmutación</span>
      <div id="desc-transmutacion" style="position:absolute; left:90%; top:30%; background:#fff; color:#000; padding:8px; border-radius:5px; display:none; z-index:10001; max-width:200px;">Cambia la naturaleza del aura para darle propiedades diferentes.</div>
      
      <span id="emision" style="position:absolute; left:98%; top:80%; transform:translate(-50%, -50%); background:#aa5500; padding:8px 10px; border-radius:5px; cursor:pointer;" onclick="toggleDesc('desc-emision')">Emisión</span>
      <div id="desc-emision" style="position:absolute; left:90%; top:70%; background:#fff; color:#000; padding:8px; border-radius:5px; display:none; z-index:10001; max-width:200px;">Libera aura en forma de proyectiles o ondas.</div>
      
      <span id="conjuracion" style="position:absolute; left:50%; top:105%; transform:translate(-50%, -100%); background:#5500aa; padding:8px 10px; border-radius:5px; cursor:pointer;" onclick="toggleDesc('desc-conjuracion')">Conjuración</span>
      <div id="desc-conjuracion" style="position:absolute; left:50%; top:97%; transform:translate(-50%, -100%); background:#fff; color:#000; padding:8px; border-radius:5px; display:none; z-index:10001; max-width:200px;">Crea objetos o seres a partir de aura.</div>
      
      <span id="manipulacion" style="position:absolute; left:2%; top:80%; transform:translate(-50%, -50%); background:#009944; padding:8px 10px; border-radius:5px; cursor:pointer;" onclick="toggleDesc('desc-manipulacion')">Manipulación</span>
      <div id="desc-manipulacion" style="position:absolute; left:10%; top:70%; background:#fff; color:#000; padding:8px; border-radius:5px; display:none; z-index:10001; max-width:200px;">Controla objetos o seres vivos con aura.</div>
      
      <span id="especialista" style="position:absolute; left:2%; top:20%; transform:translate(-50%, -50%); background:#aa0066; padding:8px 10px; border-radius:5px; cursor:pointer;" onclick="toggleDesc('desc-especialista')">Especialista</span>
      <div id="desc-especialista" style="position:absolute; left:10%; top:30%; background:#fff; color:#000; padding:8px; border-radius:5px; display:none; z-index:10001; max-width:200px;">Habilidades únicas que no encajan en las otras categorías.</div>
    </div>
  </div>
`;
document.body.appendChild(nemHexOverlay);

document.getElementById('btnNem').addEventListener('click', () => {
  nemHexOverlay.style.display = 'block';
  menuDiv.style.display = 'none';
});

document.getElementById('closeNem').addEventListener('click', () => {
  nemHexOverlay.style.display = 'none';
  menuDiv.style.display = menuVisible ? 'block' : 'none';
});

function toggleDesc(id) {
  const desc = document.getElementById(id);
  desc.style.display = desc.style.display === 'none' ? 'block' : 'none';
}

// Mapa (suelo)
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshPhongMaterial({ color: 0x229922, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Luz
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Jugador (persona)
const player = new THREE.Group();

//  Textura del personaje usando la imagen proporcionada
const textureLoader = new THREE.TextureLoader();
const baseMaterial = new THREE.MeshStandardMaterial({
  color: 0x3366ff,
  roughness: 0.75,
  metalness: 0.15,
});

textureLoader.load(
  'avatar.png',
  (avatarTexture) => {
    baseMaterial.map = avatarTexture;
    baseMaterial.needsUpdate = true;
    console.log('Textura de personaje cargada.');
  },
  undefined,
  (err) => {
    console.warn('Error cargando avatar.png, usando color sólido', err);
  }
);

const fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0x3366ff, roughness: 0.6, metalness: 0.2 });

// Piernas
const legMat = baseMaterial; // siempre usar material base, textura se asignará cuando cargue
const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), legMat);
leftLeg.position.set(-0.2, 0.45, 0);
leftLeg.castShadow = true;
player.add(leftLeg);

const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), legMat);
rightLeg.position.set(0.2, 0.45, 0);
rightLeg.castShadow = true;
player.add(rightLeg);

// Cuerpo
const torsoGeo = new THREE.BoxGeometry(0.7, 1.0, 0.35);
const torso = new THREE.Mesh(torsoGeo, baseMaterial);
torso.position.y = 1.15;
torso.castShadow = true;
player.add(torso);

// Brazos
const armMat = baseMaterial;
const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, 0.2), armMat);
leftArm.position.set(-0.55, 1.2, 0);
leftArm.castShadow = true;
player.add(leftArm);

const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, 0.2), armMat);
rightArm.position.set(0.55, 1.2, 0);
rightArm.castShadow = true;
player.add(rightArm);

// Cabeza
const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
const head = new THREE.Mesh(headGeo, baseMaterial);
head.position.y = 1.95;
head.castShadow = true;
player.add(head);

// Ojos
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
leftEye.position.set(-0.1, 0.05, 0.25);
head.add(leftEye);
const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
rightEye.position.set(0.1, 0.05, 0.25);
head.add(rightEye);

// Detalle: neck / collar
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12), new THREE.MeshPhongMaterial({ color: 0xffddaa }));
neck.position.y = 1.5;
neck.castShadow = true;
player.add(neck);

player.position.set(0, 0, 0);
scene.add(player);

// Estructuras (árboles)
const treePositions = [];
const mountainPositions = [];

function createTree(x, z) {
  const trunkHeight = 1.6 + Math.random() * 1.2; // 1.6-2.8
  const trunkRadius = 0.2 + Math.random() * 0.15; // 0.2-0.35
  const foliageHeight = 1.8 + Math.random() * 1.2; // 1.8-3
  const foliageRadius = 1.0 + Math.random() * 0.8; // 1-1.8

  const trunkGeo = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 0.85, trunkHeight, 16);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, trunkHeight / 2, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;

  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1b7f1b, flatShading: true });

  const leaves1 = new THREE.Mesh(new THREE.ConeGeometry(foliageRadius, foliageHeight * 0.5, 12), leavesMat);
  leaves1.position.set(x, trunkHeight + foliageHeight * 0.25, z);
  leaves1.castShadow = true;

  const leaves2 = new THREE.Mesh(new THREE.ConeGeometry(foliageRadius * 0.8, foliageHeight * 0.4, 12), leavesMat);
  leaves2.position.set(x, trunkHeight + foliageHeight * 0.5, z);
  leaves2.castShadow = true;

  const leaves3 = new THREE.Mesh(new THREE.ConeGeometry(foliageRadius * 0.6, foliageHeight * 0.3, 12), leavesMat);
  leaves3.position.set(x, trunkHeight + foliageHeight * 0.8, z);
  leaves3.castShadow = true;

  scene.add(trunk, leaves1, leaves2, leaves3);
  treePositions.push({ x, z, radius: foliageRadius * 0.9, top: trunkHeight + foliageHeight * 0.8 });
}

function createMountain(x, z) {
  const height = 3 + Math.random() * 3; // 3-6, para poder brincar
  const radius = 4 + Math.random() * 3; // 4-7, más grandes para cubrir
  const color = 0x666666 + Math.floor(Math.random() * 0x333333);
  const mat = new THREE.MeshStandardMaterial({ color: color });
  const mountain = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), mat);
  mountain.position.set(x, height / 2, z);
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  scene.add(mountain);
  mountainPositions.push({ x, z, radius, top: height });
}

for (let i = 0; i < 25; i++) {
  const x = (Math.random() - 0.5) * 180;
  const z = (Math.random() - 0.5) * 180;

  if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
  createTree(x, z);
}

// Montañas en los bordes (sin espacios, formando una barrera continua)
for (let i = 0; i < 60; i++) {
  const angle = (i / 60) * Math.PI * 2;
  const radius = 88 + Math.random() * 4;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  createMountain(x, z);
}

// Cámara posición inicial
camera.position.set(0, 6, 12);
const cameraTarget = new THREE.Vector3(0, 0, 0);

// Cámara libre estilo Roblox
let cameraDistance = 14;
let cameraYaw = 0;
let cameraPitch = Math.PI / 6;
let isRotatingCamera = false;
let lastMouseX = 0;
let lastMouseY = 0;

window.addEventListener('mousedown', (e) => {
  if (e.button === 2 || e.button === 0) {
    isRotatingCamera = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    e.preventDefault();
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 2 || e.button === 0) {
    isRotatingCamera = false;
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isRotatingCamera) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  cameraYaw -= dx * 0.005;
  cameraPitch -= dy * 0.005;
  cameraPitch = THREE.MathUtils.clamp(cameraPitch, 0.15, Math.PI / 2.2);
});

window.addEventListener('wheel', (e) => {
  cameraDistance += e.deltaY * 0.01;
  cameraDistance = THREE.MathUtils.clamp(cameraDistance, 6, 30);
  e.preventDefault();
});

// Controles flecha + salto
let keys = {};
let walkCycle = 0;
let isJumping = false;
let isOnGround = true;
let yVelocity = 0;
let landingProgress = 0;
let jumpsUsed = 0;
const maxJumps = 2;
const jumpPower = 0.34;
const gravity = 0.018;

function startJump() {
  if (isSliding) return; // no saltar durante deslizamiento
  if (jumpsUsed < maxJumps) {
    isJumping = true;
    isOnGround = false;
    jumpsUsed++;
    yVelocity = jumpPower;
    landingProgress = 0;
  }
}

function startSlide() {
  if (!isSliding) {
    isSliding = true;
    slideTime = 60; // 1 segundo a 60fps
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    startJump();
  } else if (e.key.toLowerCase() === 'm') {
    e.preventDefault();
    menuVisible = !menuVisible;
    menuDiv.style.display = menuVisible ? 'block' : 'none';
  } else if (e.key.toLowerCase() === 'c') {
    e.preventDefault();
    startSlide();
  } else {
    keys[e.key] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key !== ' ' && e.key !== 'Spacebar') {
    keys[e.key] = false;
  }
});

function checkObstacleCollision(x, z, currentY) {
  const playerRadius = 0.6;
  // Check trees
  for (const tree of treePositions) {
    const dist = Math.hypot(x - tree.x, z - tree.z);
    if (dist < playerRadius + tree.radius) {
      if (currentY > tree.top + 0.5) continue;
      return true;
    }
  }
  // Check mountains
  for (const mountain of mountainPositions) {
    const dist = Math.hypot(x - mountain.x, z - mountain.z);
    if (dist < playerRadius + mountain.radius) {
      if (currentY > mountain.top + 0.5) continue;
      return true;
    }
  }
  return false;
}

function update() {
  const speed = 0.12; // lento y fluido
  let moving = false;

  let deltaX = 0;
  let deltaZ = 0;

  // Movimiento relativo a la orientación de la cámara
  let moveVector = new THREE.Vector3();
  if (keys['ArrowUp']) { moveVector.z -= 1; }
  if (keys['ArrowDown']) { moveVector.z += 1; }
  if (keys['ArrowLeft']) { moveVector.x -= 1; }
  if (keys['ArrowRight']) { moveVector.x += 1; }

  if (moveVector.length() > 0) {
    moveVector.normalize().multiplyScalar(speed);
    moveVector.applyEuler(new THREE.Euler(0, cameraYaw, 0));
    deltaX = moveVector.x;
    deltaZ = moveVector.z;
    moving = true;

    // Rotar el jugador hacia la dirección de movimiento
    player.rotation.y = Math.atan2(moveVector.x, moveVector.z);
  }

  // A/S para zoom de cámara
  if (keys['a'] || keys['A']) { cameraDistance = Math.max(6, cameraDistance - 0.25); }
  if (keys['s'] || keys['S']) { cameraDistance = Math.min(30, cameraDistance + 0.25); }

  let nextX = THREE.MathUtils.clamp(player.position.x + deltaX, -95, 95);
  let nextZ = THREE.MathUtils.clamp(player.position.z + deltaZ, -95, 95);

  // Prueba por ejes para evitar atravesar árboles
  if (!checkObstacleCollision(nextX, player.position.z, player.position.y)) {
    player.position.x = nextX;
  }
  if (!checkObstacleCollision(player.position.x, nextZ, player.position.y)) {
    player.position.z = nextZ;
  }

  // Animación caminando y salto
  if (isJumping) {
    // pierna/ brazo en posición de salto
    leftArm.rotation.x = -0.4;
    rightArm.rotation.x = 0.4;
    leftLeg.rotation.x = 0.4;
    rightLeg.rotation.x = -0.4;
    walkCycle += 0.05;
  } else if (moving) {
    walkCycle += 0.12; // ciclo de movimiento
    const swing = Math.sin(walkCycle) * 0.45;
    leftArm.rotation.x = swing;
    rightArm.rotation.x = -swing;
    leftLeg.rotation.x = -swing;
    rightLeg.rotation.x = swing;
  } else {
    walkCycle *= 0.92; // suaviza reposo
    const idleSwing = Math.sin(walkCycle) * 0.08;
    leftArm.rotation.x = idleSwing;
    rightArm.rotation.x = -idleSwing;
    leftLeg.rotation.x = -idleSwing * 0.5;
    rightLeg.rotation.x = idleSwing * 0.5;
  }

  // Salto y gravedad
  if (isJumping) {
    yVelocity -= gravity * 0.55; // reducción para caída más lenta
    const nextY = player.position.y + yVelocity;

    // Chequear aterrizaje sobre árbol (copa) o suelo
    let landed = false;
    let targetY = 0;

    for (const tree of treePositions) {
      const dist = Math.hypot(player.position.x - tree.x, player.position.z - tree.z);
      if (dist < tree.radius + 0.6) {
        if (nextY <= tree.top + 0.02 && player.position.y > tree.top) {
          landed = true;
          targetY = tree.top;
          break;
        }
      }
    }

    if (landed) {
      player.position.y = targetY;
      isJumping = false;
      isOnGround = true;
      jumpsUsed = 0;
      yVelocity = 0;
      landingProgress = 1.0;
    } else {
      if (!isSliding) {
        player.position.y = Math.max(nextY, 0);
      }
      if (player.position.y === 0 && !isSliding) {
        isJumping = false;
        isOnGround = true;
        jumpsUsed = 0;
        yVelocity = 0;
        landingProgress = 1.0;
      }
    }
  }

  // Animación de aterrizaje suave
  if (!isJumping && landingProgress > 0 && !isSliding) {
    landingProgress = Math.max(0, landingProgress - 0.04);
    const landingFactor = 1 - Math.sin((1 - landingProgress) * Math.PI) * 0.08;
    player.scale.set(1, landingFactor, 1);
    if (landingProgress === 0) {
      player.scale.set(1, 1, 1);
    }
  }

  // Deslizamiento (tecla C)
  if (isSliding) {
    player.position.y = -0.3; // bajar al piso
    const slideSpeed = 0.15;
    player.position.z += slideSpeed;
    slideTime--;
    if (slideTime <= 0) {
      isSliding = false;
      player.position.y = 0; // volver al suelo
      landingProgress = 1.0; // reset landing
    }
  }

  // Alternar modo primera/tercera persona según zoom
  const firstPerson = cameraDistance <= 7.5;
  player.visible = !firstPerson;

  if (firstPerson) {
    const eyePos = new THREE.Vector3(player.position.x, player.position.y + 1.6, player.position.z);
    camera.position.lerp(eyePos, 0.25);

    const lookDir = new THREE.Vector3(
      Math.sin(cameraYaw) * Math.cos(cameraPitch),
      Math.sin(cameraPitch),
      Math.cos(cameraYaw) * Math.cos(cameraPitch)
    );

    const targetPos = eyePos.clone().add(lookDir);
    camera.lookAt(targetPos);
  } else {
    const camOffset = new THREE.Vector3(
      Math.sin(cameraYaw) * Math.cos(cameraPitch),
      Math.sin(cameraPitch),
      Math.cos(cameraYaw) * Math.cos(cameraPitch)
    ).multiplyScalar(cameraDistance);

    const desiredCamPos = new THREE.Vector3(
      player.position.x + camOffset.x,
      player.position.y + camOffset.y + 2,
      player.position.z + camOffset.z
    );

    camera.position.lerp(desiredCamPos, 0.1);
    cameraTarget.lerp(new THREE.Vector3(player.position.x, player.position.y + 1.2, player.position.z), 0.15);
    camera.lookAt(cameraTarget);
  }
}

function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

animate();