// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import { OrbitControls } from "../lib/OrbitControls.module.js"
import { GUI } from "../lib/lil-gui.module.min.js"
import { TWEEN } from "../lib/tween.module.min.js"

// Modulos propios
import { loadAll } from "./cargarModelos.js"
import { pos_casa, pos, y_suelo_fichas } from "./constantes.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot, material, cameraControls, movementController;
let gui, valorDado = -1, turno = -1;
let guiControls = {}
const pos_fichas = {}
const fichas = {
    "rojo": {
        "camara": {x: 0, y: 524, z: 181},
        "pos_inicial": {x: 70, z: 70},
        "color": {r: 200, g: 0, b: 0},
        "casillas": {actual: -1, salida: 0, entrada: 63},
        "llegando_casa": false
    },
    "azul": {
        "camara": {x: 177, y: 528, z: 0},
        "pos_inicial": {x: 70, z: -70},
        "color": {r: 0, g: 0, b: 200},
        "casillas": {actual: -1, salida: 17, entrada: 12},
        "llegando_casa": false
    },
    "amarillo": {
        "camara": {x: 0, y: 531, z: -172},
        "pos_inicial": {x: -70, z: -70},
        "color": {r: 200, g: 200, b: 0},
        "casillas": {actual: -1, salida: 34, entrada: 29},
        "llegando_casa": false
    },
    "verde": {
        "camara": {x: -173, y: 529, z: 0},
        "pos_inicial": {x: -70, z: 70},
        "color": {r: 0, g: 150, b: 0},
        "casillas": {actual: -1, salida: 51, entrada: 46},
        "llegando_casa": false
    }
}

let funcActualizacion, lastTimeMsec = null;
let toastTimeout = null;
let matchStartTime = null;

// Variables camara cenital
let camaraCenital;
const L = 110;

function showToast(message, turn, timeout) {

    if (toastTimeout) { 
        clearTimeout(toastTimeout); 
        toastTimeout = null;
    }

    const toast = document.getElementById("liveToast")
    document.getElementById("mainToastText").innerHTML = message

    const turnText = document.getElementById("turnText")
    switch (turn) {        

        case 0: // Rojo
            turnText.innerHTML = 'Turno: <span style="color: red; font-weight: bold;">Rojo</span>'
            break
        case 1: // Azul
            turnText.innerHTML = 'Turno: <span style="color: blue; font-weight: bold;">Azul</span>'
            break
        case 2: // Amarillo
            turnText.innerHTML = 'Turno: <span style="color: yellow; font-weight: bold;">Amarillo</span>'
            break
        case 3: // Verde
            turnText.innerHTML = 'Turno: <span style="color: green; font-weight: bold;">Verde</span>'
            break

    }

    toast.classList.remove("hide")
    toast.classList.add("show")

    toast.style.opacity = 0;
    let opacidad = {valor: 0}

    new TWEEN.Tween(opacidad)
        .to({valor: [1]}, 500)
        .onUpdate((value) => { toast.style.opacity = value["valor"] })
        .onComplete(() => {
            if (timeout) {
                toastTimeout = setTimeout(() => { hideToast() }, timeout)
            }
        })
        .start()

}

function hideToast() {

    const toast = document.getElementById("liveToast")

    let opacidad = {valor: 1}

    new TWEEN.Tween(opacidad)
        .to({valor: [0]}, 500)
        .onUpdate((value) => { toast.style.opacity = value["valor"] })
        .onComplete(() => {
            toast.classList.remove("show")
            toast.classList.add("hide")
        })
        .start()

}

function init() {

    // Instanciar el motor
    renderer = new THREE.WebGLRenderer()
    renderer.setSize( window.innerWidth, window.innerHeight )
    renderer.setClearColor(new THREE.Color(0.5, 0.5, 0.5))
    document.getElementById("container").appendChild(renderer.domElement)
    renderer.autoClear = false

    // Instanciar la escena
    scene = new THREE.Scene()

    // Instanciar la camara
    const aspectRatio = window.innerWidth / window.innerHeight
    camera = new THREE.PerspectiveCamera( 75, aspectRatio, 1, 10000 )
    camera.position.set( -350, 800, 350 )

    cameraControls = new OrbitControls(camera, renderer.domElement)
    cameraControls.target.set(0, 340, 0)
    camera.lookAt(0, 340, 0)

    // Limitar zoom
    //cameraControls.maxDistance = 500
    //cameraControls.minDistance = 30

    camaraCenital = new THREE.OrthographicCamera( -L, L, L, -L, 10, 1000 );
    camaraCenital.position.set(0,400,0)
    camaraCenital.lookAt(0,0,0)
    camaraCenital.up = new THREE.Vector3(0,0,-1)

    const keyboard = new THREEx.KeyboardState(renderer.domElement);
    renderer.domElement.setAttribute("tabIndex", "0");
	renderer.domElement.focus();

    funcActualizacion = (delta) => {
		if (keyboard.pressed('left')) {
			robot.position.z -= 1 * delta;		
		} else if (keyboard.pressed('right')) {
			robot.position.z += 1 * delta;
		}
		if (keyboard.pressed('down')) {
			robot.position.x -= 1 * delta;		
		} else if (keyboard.pressed('up')) {
			robot.position.x += 1 * delta;		
		}
	}

    // Manejador de cambio de dimensiones de ventana
    window.addEventListener("resize", windowResize)

    document.getElementById("closeToast").addEventListener("click", () => {
        if (toastTimeout) {
            clearTimeout(toastTimeout)
            toastTimeout = null
        }
        hideToast()
    })

    renderer.domElement.addEventListener('dblclick', rayTracing);

    for (const color in fichas) {
        pos_fichas[color] = {
            x: fichas[color]["pos_inicial"].x,
            y: y_suelo_fichas,
            z: fichas[color]["pos_inicial"].z
        }
    }

}

function loadScene() {

    const grassTexture = new THREE.TextureLoader().load("images/grass_128.jpg")
    grassTexture.repeat.set(12, 12)
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping

    material = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        map: grassTexture
    })

    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add( ambientLight ); 
    const luz1 = new THREE.PointLight(0xFFFFFF, 0.5);
    luz1.position.set(0, 500, 0);
    scene.add( luz1 );
    const luz2 = new THREE.PointLight(0xFFFFFF, 0.2);
    luz2.position.set(0, 500, -50);
    scene.add( luz2 );
    const luz3 = new THREE.PointLight(0xFFFFFF, 0.2);
    luz3.position.set(0, 500, 50);
    scene.add( luz3 );

    // Suelo (perpendicular a eje Z por defecto)
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 10, 10), material)
    suelo.rotateX(-Math.PI/2)
    scene.add(suelo)

    // Base de ladrillo
    const brickTexture = new THREE.TextureLoader().load("images/brick_225.jpg")
    brickTexture.repeat.set(4, 4)
    brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping
    const brickMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF, map: brickTexture})

    const base = new THREE.Mesh(new THREE.CylinderGeometry(600, 600, 10, 20), brickMaterial)
    scene.add(base)

    // Cargar todos los modelos externos
    loadAll(scene, fichas)

}

const switch_turn = () => {

    turno = (turno+1) % 4
    showToast("Es turno de " + Object.keys(fichas)[turno], turno, 1000)
    new TWEEN.Tween(camera.position)
        .to({
            x: [fichas[Object.keys(fichas)[turno]]["camara"].x],
            y: [fichas[Object.keys(fichas)[turno]]["camara"].y], 
            z: [fichas[Object.keys(fichas)[turno]]["camara"].z]
        }, 2000)
        .interpolation(TWEEN.Interpolation.CatmullRom)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(pos => {
            cameraControls.target.set(0, 340, 0)
            camera.lookAt(0, 340, 0)
        })
        .onComplete(() => {
            guiControls["dice"].enable()
        })
        .start()

}

const move_pawn = (ficha, n, cambiar_turno) => {

    const color = ficha.name.substring(ficha.name.indexOf("_")+1)
    const pos_actual = fichas[color]["casillas"]["actual"]
    if (pos_actual < 0) return

    let destino = pos_actual
    for (let i = 0; i < n; i++) {
        if (destino == fichas[color]["casillas"]["entrada"]) {
            fichas[color]["llegando_casa"] = true
            destino = 0
        } else if (fichas[color]["llegando_casa"]) {
            destino++;
            if (destino == pos_casa[color].length) {
                valorDado = -1
                if (cambiar_turno) switch_turn()
                return false;
            }
        } else {
            destino = (destino+1) % pos.length
        }
    }

    const pos_destino = fichas[color]["llegando_casa"] ? pos_casa[color][destino] : pos[destino]

    gui.hide()
    new TWEEN.Tween(pos_fichas[color])
        .to({
            x: [pos_destino[0]],
            y: [y_suelo_fichas+20, y_suelo_fichas], 
            z: [pos_destino[1]]
        }, 100)
        .interpolation(TWEEN.Interpolation.CatmullRom)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
            fichas[color]["casillas"]["actual"] = destino
            gui.show()
            if (cambiar_turno) switch_turn()
        })
        .start()

    valorDado = -1
    return true;

}

function addGui() {

	// Definicion de los controles
	movementController = {
        match_duration: "",
        time: "",
        throw_dice: () => {
            guiControls["dice"].disable()
            valorDado = THREE.MathUtils.randInt(1, 6)
            showToast("Ha salido el valor " + valorDado, turno, 2000)
        },
        move_pawn: () => move_pawn(fichas["rojo"]["objeto"], 1, false),
        start_match: () => {

            guiControls["start"].disable()
            valorDado = -1

            for (const color in pos_fichas) {
                new TWEEN.Tween(pos_fichas[color])
                .to({
                    x: [pos[fichas[color]["casillas"]["salida"]][0]],
                    y: [y_suelo_fichas+20, y_suelo_fichas], 
                    z: [pos[fichas[color]["casillas"]["salida"]][1]]
                }, 2000)
                .interpolation(TWEEN.Interpolation.CatmullRom)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onComplete(() => {
                    // Se completan 4 animaciones
                    fichas[color]["casillas"]["actual"] = fichas[color]["casillas"]["salida"]
                    fichas[color]["llegando_casa"] = false
                })
                .start()
            }

            turno = THREE.MathUtils.randInt(0, 3)
            
            new TWEEN.Tween(camera.position)
                .to({
                    x: [fichas[Object.keys(fichas)[turno]]["camara"].x],
                    y: [fichas[Object.keys(fichas)[turno]]["camara"].y], 
                    z: [fichas[Object.keys(fichas)[turno]]["camara"].z]
                }, 2000)
                .interpolation(TWEEN.Interpolation.CatmullRom)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(pos => {
                    cameraControls.target.set(0, 340, 0)
                    camera.lookAt(0, 340, 0)
                })
                .onComplete(() => {
                    guiControls["finish"].enable()
                    guiControls["dice"].enable()
                    matchStartTime = new Date()
                })
                .start()

            showToast("Es turno de " + Object.keys(fichas)[turno], turno, 2000)

        },
        end_match: () => {

            if (!confirm("¿Seguro que quieres finalizar la partida?")) return

            matchStartTime = null
            guiControls["finish"].disable()
            guiControls["dice"].disable()
            valorDado = -1

            for (const color in pos_fichas) {
                new TWEEN.Tween(pos_fichas[color])
                .to({
                    x: [fichas[color]["pos_inicial"].x],
                    y: [y_suelo_fichas+20, y_suelo_fichas], 
                    z: [fichas[color]["pos_inicial"].z]
                }, 2000)
                .interpolation(TWEEN.Interpolation.CatmullRom)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onComplete(() => {
                    fichas[color]["casillas"]["actual"] = -1
                })
                .start()
            }

            new TWEEN.Tween(camera.position)
                .to({
                    x: [-350],
                    y: [800], 
                    z: [350]
                }, 2000)
                .interpolation(TWEEN.Interpolation.CatmullRom)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(pos => {
                    cameraControls.target.set(0, 340, 0)
                    camera.lookAt(0, 340, 0)
                })
                .onComplete(() => {
                    guiControls["start"].enable()
                })
                .start()

        }
	};

	// Creacion interfaz
	gui = new GUI({ title: "Control partida" });

	// Construccion del menu
    guiControls["dice"] = gui.add(movementController, "throw_dice").name("Tirar dado").disable()
    guiControls["start"] = gui.add(movementController, 'start_match' ).name("Comenzar partida");
    guiControls["finish"] = gui.add(movementController, 'end_match' ).name("Finalizar partida").disable();
    gui.add(movementController, 'move_pawn' ).name("Mover ficha");

    const folder = gui.addFolder( 'Detalles' );
    guiControls["match_duration"] = folder.add(movementController, "match_duration").name("Duración partida").listen().disable();
    folder.add(movementController, "time").name("Hora").listen().disable();
    folder.show()

}

const update = () => {

    //console.log(scene.getObjectByName("dado"))

    movementController.time = new Date().toLocaleTimeString()

    if (matchStartTime) {
        let timeDiff = new Date() - matchStartTime;
        const hh = Math.floor(timeDiff / 1000 / 60 / 60);
        timeDiff -= hh * 1000 * 60 * 60;
        const mm = Math.floor(timeDiff / 1000 / 60);
        timeDiff -= mm * 1000 * 60;
        const ss = Math.floor(timeDiff / 1000);
    
        movementController.match_duration = parseDecNumber(hh) + ":" + parseDecNumber(mm) + ":" + parseDecNumber(ss)
    } else {
        movementController.match_duration = "Sin partida en curso"
    }

    // Actualizar variables del menu
    for (const color in fichas) {
        if (!fichas[color]["objeto"]) break;
        fichas[color]["objeto"].position.x = pos_fichas[color].x
        fichas[color]["objeto"].position.y = pos_fichas[color].y
        fichas[color]["objeto"].position.z = pos_fichas[color].z
    }

    // Actualizar animaciones
    TWEEN.update()

}

function render(time) {
    requestAnimationFrame(render)
    update()

    // Borrar una unica vez
    renderer.clear()

    // Camara principal
    renderer.setViewport(0,0,window.innerWidth, window.innerHeight)
    renderer.render(scene, camera)

    const cameraSize = window.innerWidth < window.innerHeight ? 
        window.innerWidth * 0.25 : window.innerHeight * 0.25

    // Camara cenital
    renderer.setViewport(0,window.innerHeight-cameraSize+1,cameraSize,cameraSize)
    renderer.render(scene, camaraCenital)

    // Mover robot
    lastTimeMsec = lastTimeMsec || time
    const delta = time - lastTimeMsec
    funcActualizacion(delta / 10)
    lastTimeMsec = time

}

function rayTracing(evento) {
    // Capturar la posicion de doble click (S.R. top-left con Y down)
    let x = evento.clientX;
    let y = evento.clientY;

    // Normalizar las coordenadas de click al cuadrado de 2x2

    x = ( x / window.innerWidth ) * 2 - 1;
    y = -( y / window.innerHeight ) * 2 + 1;

    // Rayo e intersecciones
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2(x,y), camera);

    for (const color in fichas) {
        const ficha = fichas[color]["objeto"]
        if (!ficha) break;

        const is = rayo.intersectObjects(ficha.children, true)
        if (is.length > 0 && valorDado > 0 && color == Object.keys(fichas)[turno]) {
            move_pawn(ficha, valorDado, true)
        }
    }
        
}

// Listeners

const windowResize = () => {
    const aspectRatio = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Camara perspectiva
    camera.aspect = aspectRatio;

    // Camara cenital (ortografica)
    camaraCenital.left = -L
    camaraCenital.right = L
    camaraCenital.top = L
    camaraCenital.bottom = -L
    
    camaraCenital.updateProjectionMatrix();
    camera.updateProjectionMatrix();
}

// Funciones auxiliares

const parseDecNumber = (n) => {
    return (n >= 10) ? n : "0" + n;
}

// Lanzar aplicacion

init()
loadScene()
addGui()
render()