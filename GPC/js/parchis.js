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
let dado;
const y_suelo_fichas = 27.5
const pos_fichas = {}
const fichas = {
    "rojo": {
        "pos_inicial": {x: 70, z: 70},
        "color": {r: 200, g: 0, b: 0},
        "pos_salida": {x: 24, z: 66},
        "casilla_actual": -1
    },
    "verde": {
        "pos_inicial": {x: -70, z: 70},
        "color": {r: 0, g: 150, b: 0},
        "pos_salida": {x: -66, z: 24},
        "casilla_actual": -1
    },
    "amarillo": {
        "pos_inicial": {x: -70, z: -70},
        "color": {r: 200, g: 200, b: 0},
        "pos_salida": {x: -24, z: -66},
        "casilla_actual": -1
    },
    "azul": {
        "pos_inicial": {x: 70, z: -70},
        "color": {r: 0, g: 0, b: 200},
        "pos_salida": {x: 66, z: -24},
        "casilla_actual": -1
    }
}

const posIniciales = {};
let funcActualizacion, lastTimeMsec = null, elf;

// Variables camara cenital
let camaraCenital;
const L = 100;

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
    camera = new THREE.PerspectiveCamera( 75, aspectRatio, 1, 1500 )
    camera.position.set( 150, 230, 0 )

    cameraControls = new OrbitControls(camera, renderer.domElement)
    cameraControls.target.set(0, 120, 0)
    camera.lookAt(0, 120, 0)

    // Limitar zoom
    //cameraControls.maxDistance = 500
    //cameraControls.minDistance = 30

    camaraCenital = new THREE.OrthographicCamera( -L, L, L, -L, 10, 400 );
    camaraCenital.position.set(0,L*3,0)
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

    for (const color in fichas) {
        pos_fichas[color] = {
            x: fichas[color]["pos_inicial"].x,
            y: y_suelo_fichas,
            z: fichas[color]["pos_inicial"].z
        }        
    }

}

function loadScene() {

    material = new THREE.MeshBasicMaterial({
        color: "yellow",
        wireframe: true
    })

    /*material = new THREE.MeshNormalMaterial({
        wireframe: false,
        flatShading: true
    })*/

    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add( ambientLight ); 
    const luz1 = new THREE.PointLight(0xFFFFFF, 0.5);
    luz1.position.set(0, 160, 0);
    scene.add( luz1 );
    const luz2 = new THREE.PointLight(0xFFFFFF, 0.2);
    luz2.position.set(0, 250, -50);
    scene.add( luz2 );
    const luz3 = new THREE.PointLight(0xFFFFFF, 0.2);
    luz3.position.set(0, 250, 50);
    scene.add( luz3 );

    // Suelo (perpendicular a eje Z por defecto)
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 10, 10), material)
    suelo.rotateX(-Math.PI/2)
    scene.add(suelo)

    // Helper de ejes
    scene.add(new THREE.AxesHelper(100))

    // Cargar tablero
    const colladaLoader = new ColladaLoader();
    colladaLoader.load('models/tablero/model.dae', add_board);

    // Cargar dado y fichas
    const gltfLoader = new GLTFLoader();
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
    tablero.position.set(-110,0,452)
    scene.add(tablero);
   
}

const add_dice = (objeto) => {

    dado = objeto.scene
    objeto.scene.scale.set(1000,1000,1000);
    objeto.scene.position.y = 25.9;
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
        ficha.scale.set(2,2,2);
        ficha.rotation.x = -Math.PI/2
        fichas[color]["objeto"] = ficha
        scene.add(ficha);
    }

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
        start_match: () => {

            for (const color in pos_fichas) {
                new TWEEN.Tween(pos_fichas[color])
                .to({
                    x: [fichas[color]["pos_salida"].x],
                    y: [y_suelo_fichas+20, y_suelo_fichas], 
                    z: [fichas[color]["pos_salida"].z]
                }, 2000)
                .interpolation(TWEEN.Interpolation.CatmullRom)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start()
            }

        },
        end_match: () => {

            for (const color in pos_fichas) {
                new TWEEN.Tween(pos_fichas[color])
                .to({
                    x: [fichas[color]["pos_inicial"].x],
                    y: [y_suelo_fichas+20, y_suelo_fichas], 
                    z: [fichas[color]["pos_inicial"].z]
                }, 2000)
                .interpolation(TWEEN.Interpolation.CatmullRom)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start()
                fichas[color]["casilla_actual"] = -1
            }

        }
	};

	// Creacion interfaz
	const gui = new GUI({ title: "Control partida" });

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
    gui.add(movementController, 'start_match' ).name("Comenzar partida");
    gui.add(movementController, 'end_match' ).name("Finalizar partida");

    const folder = gui.addFolder( 'Position' );
    let elem = folder.add(movementController, "separacion_pinza", 0.0, 15.0, 0.025);
    elem.disable()
    elem.enable()
    folder.show()

}

const update = () => {

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