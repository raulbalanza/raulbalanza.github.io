/**
 * Parchis.js
 * 
 * Proyecto final de la asignatura Gráficos por Computador.
 * 
 * @author Raúl Balanzá <raubagar@inf.upv.es>
 * @date   Oct,2022
 * 
 */


// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import * as CANNON from "../lib/cannon-es.js"
import { OrbitControls } from "../lib/OrbitControls.module.js"
import { GUI } from "../lib/lil-gui.module.min.js"
import { TWEEN } from "../lib/tween.module.min.js"
import Stats from "../lib/stats.module.js"

// Modulos propios
import { loadAll, capybaras } from "./cargarModelos.js"
import { pos_casa, pos, y_suelo_fichas, y_suelo_personajes } from "./constantes.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot, material, cameraControls, movementController, stats, world, dado, dadoFisico;
let gui, valorDado = -1, turno = -1, lanzandoDado = false;
let guiControls = {}
const imageBasePath = "./images/"
const capyDirections = [{dir: "z+", rotating: false}, {dir: "z+", rotating: false}]
const pos_fichas = {}
const altura_personajes = {}
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
            turnText.innerHTML = 'Turno: <span style="color: #FFBF00; font-weight: bold;">Amarillo</span>'
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

let sueloFisicoTablero = null;

function addPhysicalWorld() {

    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -900.81, 0)
    })

    sueloFisicoTablero = new CANNON.Body({ 
        shape: new CANNON.Plane(),
        type: CANNON.Body.STATIC 
    });
    sueloFisicoTablero.quaternion.setFromAxisAngle(
        new CANNON.Vec3(1,0,0), -Math.PI/2
    );
    sueloFisicoTablero.position.y = 337 + 15
    world.addBody(sueloFisicoTablero);

    sueloFisicoTablero.addEventListener('collide', (e) => { 
        dado.visible = true
        if (e.body.id != 1 || !lanzandoDado) return

        setTimeout(() => {

            const diceRotation = dado.rotation
            const r = {
                x: (Math.trunc(diceRotation._x*100)/100), 
                y: (Math.trunc(diceRotation._y*100)/100), 
                z: (Math.trunc(diceRotation._z*100)/100)
            }
            
            console.log(r)

            console.log(Math.abs(r.x - (-Math.PI/2)), Math.abs(r.y))
            console.log(Math.abs(r.x - (Math.PI/2)), Math.abs(r.y))
            console.log(Math.abs(r.x - (Math.PI/2)), Math.abs(r.x))
            console.log(Math.abs(r.x - Math.PI), Math.abs(r.z))

            if (Math.abs(r.x - (-Math.PI/2)) < 0.01 && Math.abs(r.y) < 0.01) { valorDado = 2 }
            else if (Math.abs(r.x - (Math.PI/2)) < 0.01 && Math.abs(r.y) < 0.01) { valorDado = 1 }
            else if (
                (Math.abs(r.z - (Math.PI/2)) < 0.01 && Math.abs(r.x) < 0.01) ||
                (Math.abs(r.x - Math.PI) < 0.01 && Math.abs(r.z - (-Math.PI/2)) < 0.01)
            ) { valorDado = 4 }
            else if (
                (Math.abs(r.x - Math.PI) < 0.01 && Math.abs(r.z) < 0.01) || 
                (Math.abs(r.z - Math.PI) < 0.01 && Math.abs(r.x) < 0.01) ||
                (Math.abs(r.z - (-Math.PI)) < 0.01 && Math.abs(r.x) < 0.01)
            ) { valorDado = 5 }
            else if (
                (Math.abs(r.x) < 0.01 && Math.abs(r.z) < 0.01) ||
                (Math.abs(r.x - Math.PI) < 0.01 && Math.abs(r.z - (-Math.PI)) < 0.01) || 
                (Math.abs(r.x - Math.PI) < 0.01 && Math.abs(r.z - Math.PI) < 0.01)
            ) { valorDado = 6 }
            else { valorDado = 3 }

            lanzandoDado = false
            showToast("Ha salido el valor <b>" + valorDado  + "</b>.<br>Haz doble click en tu ficha para moverla.", turno, 2000)

        }, 2000)

    })

    dadoFisico = new CANNON.Body({ 
        shape: new CANNON.Box(new CANNON.Vec3(21.5, 21.5, 21.5)),
        position: new CANNON.Vec3(0, 800, 0),
        mass: 100,
    });

    world.addBody(dadoFisico);

    dadoFisico.linearDamping = 0.999
    dadoFisico.angularDamping = 0.999
    dadoFisico.angularVelocity.set(1000, 1000, 1000)

}

function init() {

    // Instanciar el motor
    renderer = new THREE.WebGLRenderer()
    renderer.setSize( window.innerWidth, window.innerHeight )
    renderer.setClearColor(new THREE.Color(0.5, 0.5, 0.5))
    document.getElementById("container").appendChild(renderer.domElement)
    renderer.autoClear = false
    renderer.shadowMap.enabled = true
    renderer.antialias = true

    // Instanciar la escena
    scene = new THREE.Scene()

    // Stats en esquina inferior izquierda
    stats = new Stats()
    stats.showPanel(0)
    document.body.appendChild(stats.dom)
    
    stats.dom.style.removeProperty("top")
    stats.dom.style.bottom = "0px"

    // Instanciar la camara
    const aspectRatio = window.innerWidth / window.innerHeight
    camera = new THREE.PerspectiveCamera( 75, aspectRatio, 1, 10000 )
    camera.position.set( -650, 900, 650 )
    //camera.position.set( -65, 355, 65 )
    //camera.position.set( -200, 455, 200 )

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
        altura_personajes[color] = {v: y_suelo_personajes}
    }

}

function loadScene() {

    // Habitacion
    const paredes = [];
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "meadow/posx.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "meadow/negx.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "meadow/posy.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "meadow/negy.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "meadow/posz.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "meadow/negz.jpg")}) );
    const habitacion = new THREE.Mesh(new THREE.BoxGeometry(5000,5000,5000), paredes);
    habitacion.position.y = 500
    scene.add(habitacion);

    const grassTexture = new THREE.TextureLoader().load("images/grass_736.jpg")
    grassTexture.repeat.set(12, 12)
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping

    material = new THREE.MeshStandardMaterial({

        color: 0x647d31,
        map: grassTexture
    })

    const ambientLight = new THREE.AmbientLight(0xFFFFFF);
    scene.add( ambientLight );

    // Luz direccional
    const direccional = new THREE.DirectionalLight(0xFFFFFF, 0.7)
    direccional.position.set(2500,2500,2500)
    direccional.shadow.camera.left = -3250
    direccional.shadow.camera.right = 3250
    direccional.shadow.camera.top = 3250
    direccional.shadow.camera.bottom = -3250
    direccional.shadow.camera.far = 15000
    direccional.castShadow = true
    scene.add(direccional)
    //scene.add(new THREE.CameraHelper(direccional.shadow.camera));

    // Luz direccional
    const direccional2 = new THREE.DirectionalLight(0xFFFFFF, 0.7)
    direccional2.position.set(2500,2500,-2500)
    direccional2.shadow.camera.left = -3250
    direccional2.shadow.camera.right = 3250
    direccional2.shadow.camera.top = 3250
    direccional2.shadow.camera.bottom = -3250
    direccional2.shadow.camera.far = 15000
    direccional2.castShadow = true
    scene.add(direccional2)
    //scene.add(new THREE.CameraHelper(direccional.shadow.camera));

    // Luz focal
    const focal = new THREE.SpotLight('gray', 1)
    focal.position.set(0, 500, 0)
    focal.target.position.set(100, 362, 100)
    focal.angle = Math.PI/7
    focal.penumbra = 0.5
    focal.castShadow = false
    scene.add(focal)

    // Suelo (perpendicular a eje Z por defecto)
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 10, 10), material)
    suelo.rotateX(-Math.PI/2)
    suelo.receiveShadow = true
    scene.add(suelo)

    // Base de ladrillo
    const brickTexture = new THREE.TextureLoader().load("images/brick_225.jpg")
    brickTexture.repeat.set(4, 4)
    brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping
    const brickMaterial = new THREE.MeshStandardMaterial({color: 'gray', map: brickTexture})

    const base = new THREE.Mesh(new THREE.CylinderGeometry(600, 600, 10, 20), brickMaterial)
    base.receiveShadow = true
    scene.add(base)

    // Cargar todos los modelos externos
    loadAll(scene, fichas)

}

const switch_turn = () => {

    setTimeout(() => {

        turno = (turno+1) % 4
        showToast("Es turno de <b>" + Object.keys(fichas)[turno] + "</b>.", turno, 2000)
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

    }, 1000)

}

const move_pawn = (ficha, n, cambiar_turno) => {

    const color = ficha.name.substring(ficha.name.indexOf("_")+1)
    const pos_actual = fichas[color]["casillas"]["actual"]
    
    if (pos_actual < 0) {
        if (valorDado != 5) {
            showToast("Necesitas sacar un <b>5</b> para salir de casa.<br>No puedes salir ahora.", 2000)
            if (cambiar_turno) switch_turn()
            return
        }

        let fichaEnSalida = false
        // Buscamos fichas en la casilla de salida
        for (const colorA in pos_fichas) {
            if (!fichas[colorA]["llegando_casa"] && fichas[colorA]["casillas"]["actual"] == fichas[color]["casillas"]["salida"]) {
                fichaEnSalida = colorA
                break
            }
        }
        if (fichaEnSalida) {
            showToast("Ya hay una ficha en tu casilla de salida.<br>No puedes salir ahora.", 2000)
            if (cambiar_turno) switch_turn()
            return false;
        }
        
        new TWEEN.Tween(pos_fichas[color])
            .to({
                x: [pos[fichas[color]["casillas"]["salida"]][0]],
                y: [y_suelo_fichas+20, y_suelo_fichas], 
                z: [pos[fichas[color]["casillas"]["salida"]][1]]
            }, 2000)
            .interpolation(TWEEN.Interpolation.CatmullRom)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                fichas[color]["casillas"]["actual"] = fichas[color]["casillas"]["salida"]
                fichas[color]["llegando_casa"] = false
                if (cambiar_turno) switch_turn()
            })
            .start()
        return true
    }

    let destino = pos_actual
    for (let i = 0; i < n; i++) {
        if (destino == fichas[color]["casillas"]["entrada"]) {
            fichas[color]["llegando_casa"] = true
            destino = 0
        } else if (fichas[color]["llegando_casa"]) {
            destino++;
            if (destino == pos_casa[color].length) {
                valorDado = -1
                showToast("El movimiento se sale del tablero.<br>No puedes mover.")
                if (cambiar_turno) switch_turn()
                return false;
            }
        } else {
            destino = (destino+1) % pos.length
        }
    }

    let haGanado = (fichas[color]["llegando_casa"] && destino == (pos_casa[color].length-1)); // Llegamos a posicion final
    let comeFicha = false;
    let fichaEnDestino = false;

    if (!fichas[color]["llegando_casa"]) { // El destino no es una casilla de casa

        // Buscamos fichas en la casilla de destino
        for (const colorA in pos_fichas) {
            if (!fichas[colorA]["llegando_casa"] && fichas[colorA]["casillas"]["actual"] == destino) {
                fichaEnDestino = colorA
                break
            }
        }

        let destinoEsSeguro = pos[destino].length > 2;

        comeFicha = !destinoEsSeguro && fichaEnDestino;
        
        let noPuedeMover = destinoEsSeguro && fichaEnDestino;
        if (noPuedeMover) {
            showToast("Ya hay una ficha en la casilla segura de destino.<br>No puedes mover.", 2000)
            if (cambiar_turno) switch_turn() 
            return false;
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
            if (haGanado) setTimeout(() => winSequence(), 2000)
            else if (comeFicha) pawnGoHome(fichaEnDestino)
            else if (cambiar_turno) switch_turn()
        })
        .start()

    valorDado = -1
    return true;

}

function pawnGoHome(color) {

    valorDado = -1
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
            valorDado = 20
            showToast("¡Te has comido a la ficha del color <b>" + color + "</b>!<br>Haz doble click en tu ficha para contar 20.", 2000)
        })
        .start()

}

function winSequence() {

    const color = Object.keys(fichas)[turno];

    const winnerPosition = {
        cam_pos: {},
        look_pos: {}
    }

    switch (color) {

        case "rojo":
            winnerPosition.cam_pos[color] = {x: 0, y: 800, z: -700}
            winnerPosition.look_pos[color] = {x: 0, y: 430, z: 0}
            break;
        case "verde":
            winnerPosition.cam_pos[color] = {x: 700, y: 800, z: 0}
            winnerPosition.look_pos[color] = {x: 0, y: 430, z: 0}
            break;
        case "amarillo":
            winnerPosition.cam_pos[color] = {x: 0, y: 800, z: 700}
            winnerPosition.look_pos[color] = {x: 0, y: 430, z: 0}
            break;
        case "azul":
            winnerPosition.cam_pos[color] = {x: -700, y: 800, z: 0}
            winnerPosition.look_pos[color] = {x: 0, y: 430, z: 0}
            break;

    }

    showToast("El color <b>" + color + "</b> ha ganado la partida!", 4000)

    new TWEEN.Tween(camera.position)
        .to({
            x: [winnerPosition.cam_pos[color].x],
            y: [winnerPosition.cam_pos[color].y], 
            z: [winnerPosition.cam_pos[color].z]
        }, 2000)
        .interpolation(TWEEN.Interpolation.CatmullRom)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(pos => {
            cameraControls.target.set(0, 340, 0)
            camera.lookAt(0, 340, 0)
        })
        .onComplete(() => {
            new TWEEN.Tween(altura_personajes[color])
                .to({v: [y_suelo_personajes+300, y_suelo_personajes]}, 5000)
                .interpolation(TWEEN.Interpolation.CatmullRom)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onComplete(() => {
                    setTimeout(() => { end_match() }, 1000)
                })
                .start()
        })
        .start()

}

function end_match() {

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
            x: [-650],
            y: [900], 
            z: [650]
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

function addGui() {

	// Definicion de los controles
	movementController = {
        match_duration: "",
        time: "",
        throw_dice: () => {
            guiControls["dice"].disable()
            dadoFisico.quaternion.set(
                THREE.MathUtils.randFloat(-1, 1), 
                THREE.MathUtils.randFloat(-1, 1), 
                THREE.MathUtils.randFloat(-1, 1), 
                THREE.MathUtils.randFloat(-1, 1)
            )
            lanzandoDado = true
            dadoFisico.position.y = 800
        },
        move_pawn: () => { 
            move_pawn(fichas["rojo"]["objeto"], 1, false) 
            setTimeout(() => console.log(fichas["rojo"]["casillas"], pos[fichas["rojo"]["casillas"]["actual"]].length), 200)
        },
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

            showToast("¡Empieza la partida!<br>Es turno de <b>" + Object.keys(fichas)[turno] + "</b>.", turno, 2000)

        },
        end_match_button: () => {
            if (!confirm("¿Seguro que quieres finalizar la partida?")) return
            end_match()
        },
        credits: () => {
            alert("hey")
        },
        winSeq: () => {winSequence()}
	};

	// Creacion interfaz
	gui = new GUI({ title: "Control partida" });

	// Construccion del menu
    guiControls["dice"] = gui.add(movementController, "throw_dice").name("Tirar dado").disable()
    guiControls["start"] = gui.add(movementController, 'start_match' ).name("Comenzar partida");
    guiControls["finish"] = gui.add(movementController, 'end_match_button' ).name("Finalizar partida").disable();
    //gui.add(movementController, 'move_pawn' ).name("Mover ficha");
    //gui.add(movementController, 'winSeq' ).name("Win sequence");

    const folder = gui.addFolder( 'Detalles' );
    folder.add(movementController, "match_duration").name("Duración partida").listen().disable();
    folder.add(movementController, "time").name("Hora").listen().disable();
    folder.add(movementController, "credits").name("Créditos");
    folder.show()

}

const update = () => {

    world.fixedStep()

    dado = scene.getObjectByName("dado")
    if (dado) {
        const posDado = new THREE.Vector3(dadoFisico.position.x, dadoFisico.position.y-11, dadoFisico.position.z)

        dado.position.copy(posDado)
        dado.quaternion.copy(dadoFisico.quaternion)
    }

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

    // Actualizar variables
    for (const color in fichas) {
        if (fichas[color]["personaje"])
            fichas[color]["personaje"].position.y = altura_personajes[color].v

        if (fichas[color]["objeto"]) {
            fichas[color]["objeto"].position.x = pos_fichas[color].x
            fichas[color]["objeto"].position.y = pos_fichas[color].y
            fichas[color]["objeto"].position.z = pos_fichas[color].z
        }
    }

    for (const i in capybaras) {
        const rotate = (capybaras[i].position.x < -600 || capybaras[i].position.x > 600) && 
            (capybaras[i].position.z < -600 || capybaras[i].position.z > 600) && 
            THREE.MathUtils.randInt(1,1000) < 5

        if (capyDirections[i].dir == "z+"){
            capybaras[i].position.z += 10
            if ((capybaras[i].position.z >= 2100 || rotate) && !capyDirections[i].rotating) {
                capyDirections[i].dir = "x+"
                rotateCapybara(capybaras[i], capyDirections[i])
            }
        } else if (capyDirections[i].dir == "x+") {
            capybaras[i].position.x += 10
            if ((capybaras[i].position.x >= 2100 || rotate) && !capyDirections[i].rotating) {
                capyDirections[i].dir = "z-"
                rotateCapybara(capybaras[i], capyDirections[i])
            }
        } else if (capyDirections[i].dir == "z-") {
            capybaras[i].position.z -= 10
            if ((capybaras[i].position.z <= -2100 || rotate) && !capyDirections[i].rotating) {
                capyDirections[i].dir = "x-"
                rotateCapybara(capybaras[i], capyDirections[i])
            }
        } else {
            capybaras[i].position.x -= 10
            if ((capybaras[i].position.x <= -2100 || rotate) && !capyDirections[i].rotating) {
                capyDirections[i].dir = "z+"
                rotateCapybara(capybaras[i], capyDirections[i])
            }
        }
    }

    // Actualizar animaciones
    TWEEN.update()

}

function rotateCapybara(object, info) {

    info.rotating = true
    const val = {v: object.rotation.z}
    new TWEEN.Tween(val)
        .to({v: [object.rotation.z + (Math.PI/2)]}, 500)
        .onUpdate((value) => { object.rotation.z = value.v })
        .onComplete(() => { info.rotating = false })
        .start()

}

function render(time) {

    stats.begin()

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

    stats.end()

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

addPhysicalWorld()
init()
loadScene()
addGui()
render()