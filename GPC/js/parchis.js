// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import { OrbitControls } from "../lib/OrbitControls.module.js"
import { GUI } from "../lib/lil-gui.module.min.js"
import { TWEEN } from "../lib/tween.module.min.js"
import { ColladaLoader } from "../lib/ColladaLoader.js"
import { GLTFLoader } from "../lib/GLTFLoader.module.js";

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot, material, cameraControls, movementController;
let dado, gui, valorDado = -1, turno = -1;
const y_suelo_fichas = 361.3
const pos_casa = {
    "rojo": [[0, 92],
    [0, 84],
    [0, 75]
    [0, 65.7],
    [0, 57.5],
    [0, 49],
    [0, 40.5],
    [0, 25.5]],
    "verde": [[-101.5, 0],
    [-92.8, 0],
    [-83.9, 0],
    [-74.8, 0],
    [-65.7, 0],
    [-56.6, 0],
    [-48, 0],
    [-39.5, 0],
    [-24.5, 0]],
    "amarillo": [[0, -92],
    [0, -84],
    [0, -75],
    [0, -65.7],
    [0, -57.5],
    [0, -49],
    [0, -40.5],
    [0, -25.5]],
    "azul": [[92.8, 0],
    [83.9, 0],
    [74.8, 0],
    [65.7, 0],
    [56.6, 0],
    [48, 0],
    [39.5, 0],
    [24.5, 0]]
}
const pos = [
    [23.1, 65.7],
    [23.1, 57.5],
    [23.1, 49],
    [23.1, 40.5],
    [39.5, 23.1],
    [48, 23.1],
    [56.6, 23.1],
    [65.7, 23.1],
    [74.8, 23.1],
    [83.9, 23.1],
    [92.8, 23.1],
    [101.5, 23.1],
    [101.5, 0],
    [101.5, -23.1],
    [92.8, -23.1],
    [83.9, -23.1],
    [74.8, -23.1],
    [65.7, -23.1],
    [56.6, -23.1],
    [48, -23.1],
    [39.5, -23.1],
    [23.1, -40.5],
    [23.1, -49],
    [23.1, -57.5],
    [23.1, -65.7],
    [23.1, -75],
    [23.1, -84],
    [23.1, -92],
    [23.1, -101],
    [0, -101],
    [-23.1, -101],
    [-23.1, -92],
    [-23.1, -84],
    [-23.1, -75],
    [-23.1, -65.7],
    [-23.1, -57.5],
    [-23.1, -49],
    [-23.1, -40.5],
    [-39.5, -23.1],
    [-48, -23.1],
    [-56.6, -23.1],
    [-65.7, -23.1],
    [-74.8, -23.1],
    [-83.9, -23.1],
    [-92.8, -23.1],
    [-101.5, -23.1],
    [-101.5, 0],
    [-101.5, 23.1],
    [-92.8, 23.1],
    [-83.9, 23.1],
    [-74.8, 23.1],
    [-65.7, 23.1],
    [-56.6, 23.1],
    [-48, 23.1],
    [-39.5, 23.1],
    [-23.1, 40.5],
    [-23.1, 49],
    [-23.1, 57.5],
    [-23.1, 65.7],
    [-23.1, 75],
    [-23.1, 84],
    [-23.1, 92],
    [-23.1, 101],
    [0, 101],
    [23.1, 101],
    [23.1, 92],
    [23.1, 84],
    [23.1, 75]
]
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

const posIniciales = {};
let funcActualizacion, lastTimeMsec = null;

// Variables camara cenital
let camaraCenital;
const L = 110;

function showToast(timeout) {

    const toast = document.getElementById("liveToast")

    toast.classList.remove("hide")
    toast.classList.add("show")

    toast.style.opacity = 0;
    let opacidad = {valor: 0}

    new TWEEN.Tween(opacidad)
        .to({valor: [1]}, 500)
        .onUpdate((value) => { toast.style.opacity = value["valor"] })
        .onComplete(() => {
            if (timeout) {
                setTimeout(() => { hideToast() }, timeout)
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

    setTimeout(() => {
        showToast(1000)
    }, 2000)

    // Instanciar la escena
    scene = new THREE.Scene()

    // Instanciar la camara
    const aspectRatio = window.innerWidth / window.innerHeight
    camera = new THREE.PerspectiveCamera( 75, aspectRatio, 1, 10000 )
    //camera.position.set( 0, 600, 0 )
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

    /*material = new THREE.MeshNormalMaterial({
        wireframe: false,
        flatShading: true
    })*/

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

    // Helper de ejes
    //scene.add(new THREE.AxesHelper(100))

    // Cargar tablero
    const colladaLoader = new ColladaLoader();
    colladaLoader.load('models/tablero/model.dae', add_board);

    // Cargar dado y fichas
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('models/metallic_garden_table.glb', (objeto) => {
        objeto.scene.scale.set(10, 10, 10)
        scene.add(objeto.scene)
    })
    gltfLoader.load('models/jugadores.glb', (objeto) => {

        let i = 4
        while (i--) {
            const personaje = objeto.scene.children[0].children[0].children[0]
            const object3d = new THREE.Object3D()
            object3d.rotation.x = -Math.PI/2
            object3d.scale.set(15, 15, 15)
            object3d.add(personaje)

            switch (personaje.name) {

                case "Object_2":
                    object3d.position.set(240,205,-155)
                    object3d.rotation.z = -Math.PI/2
                    fichas["azul"]["personaje"] = object3d
                    break
                case "Object_3":
                    object3d.position.set(-240,205,-155)
                    object3d.rotation.z = Math.PI/2
                    fichas["verde"]["personaje"] = object3d
                    break
                case "Object_4":
                    object3d.position.set(-465,205,250)
                    object3d.rotation.z = Math.PI
                    fichas["rojo"]["personaje"] = object3d
                    break
                case "Object_5":
                    object3d.position.set(-465,205,-250)
                    object3d.rotation.z = Math.PI*2
                    fichas["amarillo"]["personaje"] = object3d
                    break

            }

            scene.add(object3d)
        }
        
    })
    gltfLoader.load('models/dado/scene.gltf', add_dice);
    gltfLoader.load('models/ficha.glb', add_pawns);

}

const add_board = (objeto) => {

    const tablero = objeto.scene

    tablero.children[0].children = tablero.children[0].children
        .filter(elem => elem.type != "LineSegments" && elem.type != "Group")

    const rojos = tablero.children[0].children.filter(elem => elem.material && elem.material[0].name == "SpaltedMaple2")
    const verdes = tablero.children[0].children.filter(elem => elem.material && elem.material[0].name == "SpalteMaple")
    const amarillos = tablero.children[0].children.filter(elem => elem.material && elem.material[0].name == "SpaltedMapleVertical")
    const azules = tablero.children[0].children.filter(elem => elem.material && elem.material[0].name == "SpaltedMaple2Vertical")

    const colores = [
        [rojos[1], [verdes[1], azules[1], amarillos[1]]], // Rojo
        [verdes[2], [rojos[2], azules[2], amarillos[2]]], // Verde
        [azules[0], [rojos[0], verdes[0], amarillos[0]]], // Azul
        [amarillos[3], [rojos[3], verdes[3], azules[3]]]  // Amarillo
    ]

    for (const color of colores) {
        const material = color[0].material[0]
        for (const casilla of color[1]) {
            casilla.material[0] = material
        }
    }

    tablero.scale.set(10, 10, 10)
    tablero.position.set(-110,337,452)
    scene.add(tablero);
   
}

const add_dice = (objeto) => {

    dado = objeto.scene
    objeto.scene.scale.set(1000,1000,1000);
    objeto.scene.position.y = 363;
    objeto.scene.name = 'dado';
    scene.add(dado);

}

const add_pawns = (objeto) => {

    for (const color in fichas) {
        const ficha = objeto.scene.children[0].children[0].children[1].clone()
        for (const parte of ficha.children){
            const r = fichas[color]["color"].r/255
            const g = fichas[color]["color"].g/255
            const b = fichas[color]["color"].b/255
            parte.material = parte.material.clone()
            parte.material.color.setRGB(r, g, b)
        }
        ficha.name = 'ficha_' + color;
        ficha.position.x = fichas[color]["pos_inicial"].x
        ficha.position.y = y_suelo_fichas
        ficha.position.z = fichas[color]["pos_inicial"].z
        ficha.scale.set(1.5,1.5,1.5);
        ficha.rotation.x = -Math.PI/2
        fichas[color]["objeto"] = ficha
        scene.add(ficha);
    }

    /*const curPos = [24.5, 0]

    fichas["rojo"]["objeto"].position.x = curPos[0];
    fichas["rojo"]["objeto"].position.z = curPos[1];*/

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
                if (cambiar_turno) {
                    turno = (turno+1) % 4
                    alert("Es turno de " + Object.keys(fichas)[turno])
                }
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
            console.log("ficha ahora en " + destino)
            gui.show()
        })
        .start()

    valorDado = -1
    if (cambiar_turno) {
        turno = (turno+1) % 4
        alert("Es turno de " + Object.keys(fichas)[turno])
    }

    return true;

}

function addGui()
{

	// Definicion de los controles
	movementController = {
		giro_base: 0.0,
		giro_brazo: 0.0,
		giro_antebrazo_y: 0.0,
		giro_antebrazo_z: 0.0,
        giro_pinza: 0.0,
        separacion_pinza: 10.0,
        wireframe: false,
        throw_dice: () => { 
            valorDado = THREE.MathUtils.randInt(1, 6)
            alert("Ha salido el valor " + valorDado)
        },
        move_pawn: () => move_pawn(fichas["azul"]["objeto"], 1, false),
        start_match: () => {

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
                .start()

            //alert("Es turno de " + Object.keys(fichas)[turno])

        },
        end_match: () => {

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

        }
	};

	// Creacion interfaz
	gui = new GUI({ title: "Control partida" });

	// Construccion del menu
    gui.add(movementController, "giro_base", -180.0, 180.0, 0.025)
        .name("Giro Base")
        .listen();
    gui.add(movementController, "giro_brazo", -45.0, 45.0, 0.025)
        .name("Giro Brazo")
        .listen();
    gui.add(movementController, "giro_antebrazo_y", -180.0, 180.0, 0.025)
        .name("Giro Antebrazo Y")
        .listen();
    gui.add(movementController, "giro_antebrazo_z", -90.0, 90.0, 0.025)
        .name("Giro Antebrazo Z")
        .listen();
    gui.add(movementController, "giro_pinza", -40.0, 220.0, 0.025)
        .name("Giro Pinza")
        .listen();
    gui.add(movementController, "separacion_pinza", 0.0, 15.0, 0.025)
        .name("Separacion Pinza")
        .listen();
	gui.add(movementController, 'wireframe' )
        .name("alambres")
        .onChange(value => {
            material.wireframe = value
        });
    gui.add(movementController, "throw_dice").name("Tirar dado")
    gui.add(movementController, 'start_match' ).name("Comenzar partida");
    gui.add(movementController, 'end_match' ).name("Finalizar partida");
    gui.add(movementController, 'move_pawn' ).name("Mover ficha");

    const folder = gui.addFolder( 'Position' );
    let elem = folder.add(movementController, "separacion_pinza", 0.0, 15.0, 0.025);
    elem.disable()
    elem.enable()
    folder.show()

}

const update = () => {

    //console.log(camera.position)

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

// Auxiliares

const deg_to_rad = (degrees) => {
  return degrees * (Math.PI/180);
}

// Lanzar aplicacion

init()
loadScene()
addGui()
render()