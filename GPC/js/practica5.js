// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import { OrbitControls } from "../lib/OrbitControls.module.js"
import { GUI } from "../lib/lil-gui.module.min.js"
import { TWEEN } from "../lib/tween.module.min.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot, cameraControls, movementController;
let brazo, antebrazo, mano, pinzaIz, pinzaDer;
let materialBrillante, materialMate, materialEsfera, materialSuelo;
const posIniciales = {};
const imageBasePath = "./images/"
let funcActualizacion, lastTimeMsec = null;

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
    renderer.shadowMap.enabled = true
    renderer.antialias = true

    // Instanciar la escena
    scene = new THREE.Scene()

    // Instanciar la camara
    const aspectRatio = window.innerWidth / window.innerHeight
    camera = new THREE.PerspectiveCamera( 75, aspectRatio, 1, 1500 )
    //camera.position.set( 150, 230, 0 )
    camera.position.set( 170, 320, -170 )

    cameraControls = new OrbitControls(camera, renderer.domElement)
    cameraControls.target.set(0, 120, 0)
    camera.lookAt(0, 120, 0)

    // Limitar zoom
    cameraControls.maxDistance = 600
    cameraControls.minDistance = 30

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

    const texmetal = new THREE.TextureLoader().load(imageBasePath + "metal_128.jpg");
    materialMate = new THREE.MeshLambertMaterial({ 
        color: 'gray', 
        shading: THREE.SmoothShading, 
        map: texmetal 
    })

    const texoro = new THREE.TextureLoader().load(imageBasePath + "gold_128.jpg");
    materialBrillante = new THREE.MeshPhongMaterial({ 
        color: 0xFFD04B, 
        specular: 0xFFD04B, 
        map: texoro 
    })

    // Luz ambiental
    const ambiental = new THREE.AmbientLight(0x222222)
    scene.add(ambiental)

    // Luz direccional
    const direccional = new THREE.DirectionalLight(0xFFFFFF, 0.5)
    direccional.position.set(500,500,500)
    direccional.shadow.camera.left = -650
    direccional.shadow.camera.right = 650
    direccional.shadow.camera.top = 650
    direccional.shadow.camera.bottom = -650
    direccional.shadow.camera.far = 3000
    direccional.castShadow = true
    scene.add(direccional)
    //scene.add(new THREE.CameraHelper(direccional.shadow.camera));

    const direccional2 = new THREE.DirectionalLight(0xFFFFFF, 0.5)
    direccional2.position.set(500,500,-500)
    direccional2.shadow.camera.left = -650
    direccional2.shadow.camera.right = 650
    direccional2.shadow.camera.top = 650
    direccional2.shadow.camera.bottom = -650
    direccional2.shadow.camera.far = 3000
    direccional2.castShadow = true
    scene.add(direccional2)
    //scene.add(new THREE.CameraHelper(direccional2.shadow.camera));

    // Luz puntual
    const puntual = new THREE.PointLight(0xFFFFFF, 0.25)
    puntual.position.set(0, 300, 0)
    scene.add(puntual)

    // Luz focal
    const focal = new THREE.SpotLight('orange', 0.75)
    focal.position.set(-500,500,0)
    focal.target.position.set(0,100,0)
    focal.angle = Math.PI/7
    focal.penumbra = 0.3
    focal.castShadow = true
    focal.shadow.camera.far = 900
    focal.shadow.camera.fov = 50
    scene.add(focal)
    //scene.add(new THREE.CameraHelper(focal.shadow.camera));

    // Suelo (perpendicular a eje Z por defecto)
    const texsuelo = new THREE.TextureLoader().load(imageBasePath + "pisometalico_1024.jpg");
    texsuelo.repeat.set(4,4);
    texsuelo.wrapS = texsuelo.wrapT = THREE.RepeatWrapping;
    materialSuelo = new THREE.MeshStandardMaterial({ color: "rgb(150,150,150)", map: texsuelo });

    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 10, 10), materialSuelo)
    suelo.rotateX(-Math.PI/2)
    suelo.receiveShadow = true
    scene.add(suelo)

    // Habitacion
    const paredes = [];
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "posx.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "negx.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "posy.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "negy.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "posz.jpg")}) );
    paredes.push( new THREE.MeshBasicMaterial({side:THREE.BackSide,
                  map: new THREE.TextureLoader().load(imageBasePath + "negz.jpg")}) );
    const habitacion = new THREE.Mesh(new THREE.BoxGeometry(1000,1000,1000), paredes);
    scene.add(habitacion);

    // Brazo robot articulado
    robot = new THREE.Object3D()

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 15, 20), materialMate)
    robot.add(base)
    scene.add(robot)

    // Brazo: eje + esparrago + rotula
    brazo = new THREE.Object3D()
    robot.add(brazo)

    const eje = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 18, 20), materialMate)
    eje.rotateX(-Math.PI/2)
    brazo.add(eje)

    const esparrago = new THREE.Mesh(new THREE.BoxGeometry(18, 120, 12), materialMate)
    esparrago.position.y += 120/2
    brazo.add(esparrago)
    
    // Esfera (rotula)
    const entorno = [ 
        imageBasePath + "posx.jpg", imageBasePath + "negx.jpg",
        imageBasePath + "posy.jpg", imageBasePath + "negy.jpg",
        imageBasePath + "posz.jpg", imageBasePath + "negz.jpg"
    ];
    const texturaEsfera = new THREE.CubeTextureLoader().load(entorno);

    materialEsfera = new THREE.MeshPhongMaterial({color:'white',
                                    specular:'gray',
                                    shininess: 30,
                                    envMap: texturaEsfera });

    const esfera = new THREE.Mesh(new THREE.SphereGeometry(20, 15, 15), materialEsfera)
    esfera.position.y += 120
    brazo.add(esfera)

    // Antebrazo: disco + (nervios * 4) + cilindro
    antebrazo = new THREE.Object3D()
    antebrazo.position.y += 120
    brazo.add(antebrazo)

    const disco = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 6, 20), materialBrillante)
    antebrazo.add(disco)

    const diffX = [-8, 8, -8, 8]
    const diffZ = [-8, 8, 8, -8]
    
    for (let i = 0; i < 4; i++) {
        const nervio = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4), materialBrillante)
        nervio.position.x += diffX[i]
        nervio.position.z += diffZ[i]
        nervio.position.y += 80/2
        antebrazo.add(nervio)
    }

    // Mano: pinza izquierda + pinza derecha
    mano = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 40, 20), materialBrillante)
    mano.position.y += 80
    mano.rotateX(Math.PI/2)
    antebrazo.add(mano)

    // Definicion del dedo usando BufferGeometry
    const dedoForma = new THREE.BufferGeometry()

    dedoForma.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
        0,20,4, 0,0,4, 19,5,4, 19,15,4,      // Back (0,1,2,3) 
        19,15,2, 19,5,2, 0,0,0, 0,20,0,      // Front (4,5,6,7)
        0,20,0, 0,0,0, 0,0,4, 0,20,4,        // Left (8,9,10,11)
        19,15,4, 19,5,4, 19,5,2, 19,15,2,    // Right (12,13,14,15)       
        0,20,4, 19,15,4, 19,15,2, 0,20,0,    // Up (16,17,18,19)
        19,5,2, 19,5,4, 0,0,4, 0,0,0,        // Down (20,21,22,23)
    ]), 3))

    dedoForma.setAttribute("normal", new THREE.BufferAttribute(new Float32Array([
        0,0,1, 0,0,1, 0,0,1, 0,0,1,                                                             // Back
        0.104684,0,-0.994505, 0.104684,0,-0.994505, 0.104684,0,-0.994505, 0.104684,0,-0.994505, // Front
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,                                                 // Left
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,                                                     // Right
        0.254493,0.967074,0, 0.254493,0.967074,0, 0.254493,0.967074,0, 0.254493,0.967074,0,     // Up
        0.254493,-0.967074,0, 0.254493,-0.967074,0, 0.254493,-0.967074,0, 0.254493,-0.967074,0  // Down
    ]), 3))

    dedoForma.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([
        0,1, 0,0, 1,0, 1,1,     // Back
        0,1, 0,0, 1,0, 1,1,     // Front
        1,0, 1,1, 0,1, 0,0,     // Left
        1,0, 1,1, 0,1, 0,0,     // Right
        1,0, 1,1, 0,1, 0,0,     // Up
        1,1, 0,1, 0,0, 1,0      // Down
    ]), 2))

    dedoForma.setIndex([
        0,1,2, 2,3,0,       // Back
        4,5,6, 6,7,4,       // Front
        8,9,10, 10,11,8,    // Left
        12,13,14, 14,15,12, // Right
        16,17,18, 18,19,16, // Up
        20,21,22, 22,23,20  // Down
    ])

    // Definicion de la pinza izquierda
    pinzaIz = new THREE.Object3D()
    mano.add(pinzaIz)
    const palmaIz = new THREE.Mesh(new THREE.BoxGeometry(19, 4, 20), materialMate)
    palmaIz.position.x += 17
    palmaIz.position.y -= 4/2
    pinzaIz.add(palmaIz)
    posIniciales["pinzaIz"] = pinzaIz.position.y

    const dedo = new THREE.Mesh(dedoForma, materialMate);
    dedo.position.x += 17 + 19/2
    dedo.position.y -= 4
    dedo.position.z += 20/2
    dedo.rotation.x = -Math.PI/2
    pinzaIz.add(dedo)

    // Definicion de la pinza derecha
    pinzaDer = new THREE.Object3D()
    mano.add(pinzaDer)
    const palmaDer = new THREE.Mesh(new THREE.BoxGeometry(19, 4, 20), materialMate)
    palmaDer.position.x += 17
    palmaDer.position.y += 4/2
    pinzaDer.add(palmaDer)
    posIniciales["pinzaDer"] = pinzaDer.position.y

    const dedoDer = new THREE.Mesh(dedoForma, materialMate);
    dedoDer.position.x += 17 + 19/2
    dedoDer.position.y += 4
    dedoDer.position.z -= 20/2
    dedoDer.rotation.x = Math.PI/2
    pinzaDer.add(dedoDer)

    // Permitir recibir y emitir sombras
    robot.traverse(ob => {
        if (ob.isObject3D) {
            ob.castShadow = true;
            ob.receiveShadow = true;
        }
    });

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
            materialBrillante.wireframe = value
            materialMate.wireframe = value
            materialEsfera.wireframe = value
            materialSuelo.wireframe = value
        });
    gui.add(movementController, 'animation' ).name("Anima");
}

const update = () => {

    // Actualizar variables del menu
    pinzaIz.position.y = posIniciales["pinzaIz"] - movementController["separacion_pinza"]
    pinzaDer.position.y = posIniciales["pinzaDer"] + movementController["separacion_pinza"]

    robot.rotation.y = THREE.MathUtils.degToRad(movementController["giro_base"])
    brazo.rotation.z = THREE.MathUtils.degToRad(movementController["giro_brazo"])

    mano.rotation.y = THREE.MathUtils.degToRad(movementController["giro_pinza"])

    antebrazo.rotation.y = THREE.MathUtils.degToRad(movementController["giro_antebrazo_y"])
    antebrazo.rotation.z = THREE.MathUtils.degToRad(movementController["giro_antebrazo_z"])

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

// Lanzar aplicacion

init()
loadScene()
addGui()
render()