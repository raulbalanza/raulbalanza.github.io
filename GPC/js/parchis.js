// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import { OrbitControls } from "../lib/OrbitControls.module.js"
import { GUI } from "../lib/lil-gui.module.min.js"
import { TWEEN } from "../lib/tween.module.min.js"
import { ColladaLoader } from "../lib/ColladaLoader.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot, material, cameraControls, movementController;
let brazo, antebrazo, mano, pinzaIz, pinzaDer;
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

    // collada
    const loader = new ColladaLoader();
    loader.load( './models/tablero/model.dae', function ( collada ) {

        const escenita = collada.scene

        escenita.children[0].children = escenita.children[0].children
            .filter(elem => elem.type != "LineSegments" && elem.type != "Group")
        
        /*
        
        color rojo (655)
        411 -> azul
        415 -> rojo
        437 -> verde
        455 -> amarillo

        verde (657)
        413 -> azul
        419 -> rojo
        435 -> verde
        449 -> amarillo

        azul (661)
        407 -> azul
        421 -> rojo
        431 -> verde
        451 -> amarillo

        amarillo
        azul (659)
        409 -> azul
        417 -> rojo
        433 -> verde
        453 -> amarillo

        */ 

        const colores = [
            [415, [419, 421, 417]], // Rojo
            [435, [437, 431, 433]], // Verde
            [407, [411, 413, 409]], // Azul
            [453, [455, 449, 451]]  // Amarillo
        ]

        for (const color of colores) {
            const material = escenita.children[0].children.filter(elem => elem.id == color[0])[0].material[0]
            for (const casilla of color[1]) {
                const c = escenita.children[0].children.filter(elem => elem.id == casilla)[0]
                c.material[0] = material
            }
        }

        escenita.scale.set(10, 10, 10)
        escenita.position.set(-110,0,452)
        scene.add(escenita);

    } );

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
        animation: () => {
            
            new TWEEN.Tween(movementController)
                .to({
                    giro_base: [180.0, -180.0, 0.0],
                    giro_brazo: [45.0, -45.0, 0.0],
                    giro_antebrazo_y: [180.0, -180.0, 0.0],
                    giro_antebrazo_z: [-90.0, 90.0, 0.0],
                    giro_pinza: [220.0, -40.0, 0.0],
                    separacion_pinza: [0.0, 15.0, 10.0],
                }, 10000)
                .interpolation(TWEEN.Interpolation.Linear)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start()

        }
	};

	// Creacion interfaz
	const gui = new GUI({ title: "Control Robot" });

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
    gui.add(movementController, 'animation' ).name("Anima");
}

const update = () => {

    // Actualizar variables del menu

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