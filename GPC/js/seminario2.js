// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import { GLTFLoader } from "../lib/GLTFLoader.module.js"
import { OrbitControls } from "../lib/OrbitControls.module.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let esferaCubo, cameraControls;
let angulo = 0;

// Camaras adicionales
let alzado, planta, perfil;
const L = 5

function setCameras(aspectRatio) {

    let camaraOrtografica;

    if (aspectRatio > 1) {
        camaraOrtografica = new THREE.OrthographicCamera( -L*aspectRatio, L*aspectRatio, L, -L, 10, 100 );
    } else {
        camaraOrtografica = new THREE.OrthographicCamera( -L, L, L/aspectRatio, -L/aspectRatio, -10, 100 );
    }

    alzado = camaraOrtografica.clone()
    alzado.position.set(0,0,L)
    alzado.lookAt(0,0,0)

    planta = camaraOrtografica.clone()
    planta.position.set(0,L,0)
    planta.lookAt(0,0,0)
    planta.up = new THREE.Vector3(0,0,-1)

    perfil = camaraOrtografica.clone()
    perfil.position.set(L,0,0)
    perfil.lookAt(0,0,0)

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
    //scene.background = new THREE.Color(0.5, 0.5, 0.5)

    // Instanciar la camara
    const aspectRatio = window.innerWidth / window.innerHeight    
    camera = new THREE.PerspectiveCamera( 75, aspectRatio, 0.1, 100 )
    camera.position.set( 0.5, 2, 7 )
    setCameras(aspectRatio)

    cameraControls = new OrbitControls(camera, renderer.domElement)
    cameraControls.target.set(0, 1, 0)
    camera.lookAt(0, 1, 0)

    // Manejador de cambio de dimensiones de ventana
    window.addEventListener("resize", windowResize)
    window.addEventListener("dblclick", () => {

        // Atencion al picking

    })
    
}

function loadScene() {

    const material = new THREE.MeshBasicMaterial({
        color: "yellow",
        wireframe: true
    })

    // Suelo (perpendicular a eje Z por defecto)
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), material)
    suelo.rotateX(-Math.PI/2)
    scene.add(suelo)

    // Cubo y esfera
    const cubo = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), material)
    const esfera = new THREE.Mesh(new THREE.SphereGeometry(1,20,20), material)

    esferaCubo = new THREE.Object3D()

    esferaCubo.add(cubo)
    esferaCubo.add(esfera)

    cubo.position.x = -1
    esfera.position.x = 1
    esferaCubo.position.y = 1.5

    scene.add(esferaCubo)

    // Modelo importado json THREE.js
    const loader = new THREE.ObjectLoader()
    loader.load("./models/soldado/soldado.json", (model) => {
        cubo.add(model)
        model.position.set(0, 1, 0)
    })

    // Modelo importado en GLTF
    const glloader = new GLTFLoader();
    glloader.load("models/RobotExpressive.glb", (gltf) => {
        gltf.scene.position.y = 1
        gltf.scene.rotation.y = -Math.PI/2
        esfera.add(gltf.scene)
        console.log("Robot", gltf)
    })

    scene.add(new THREE.AxesHelper(3))

}

const update = () => {
    angulo += 0.01
    esferaCubo.rotation.y = angulo
}

function render() {
    requestAnimationFrame(render)
    update()

    // Borrar una unica vez
    renderer.clear()

    renderer.setViewport(0,0,window.innerWidth/2,window.innerHeight/2)
    renderer.render(scene, planta)

    renderer.setViewport(0,window.innerHeight/2,window.innerWidth/2,window.innerHeight/2)
    renderer.render(scene, alzado)

    renderer.setViewport(window.innerWidth/2,window.innerHeight/2,window.innerWidth/2,window.innerHeight/2)
    renderer.render(scene, perfil)

    renderer.setViewport(window.innerWidth/2, 0,window.innerWidth/2,window.innerHeight/2)
    renderer.render(scene, camera)
}

const windowResize = () => {
    const aspectRatio = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Camara perspectiva
    camera.aspect = aspectRatio;

    // Camaras ortograficas
    if (aspectRatio > 1) {
        alzado.left = planta.left = perfil.left = -L*aspectRatio
        alzado.right = planta.right = perfil.right = L*aspectRatio
        alzado.top = planta.top = perfil.top = L
        alzado.bottom = planta.bottom = perfil.bottom = -L
    } else {
        alzado.left = planta.left = perfil.left = -L
        alzado.right = planta.right = perfil.right = L
        alzado.top = planta.top = perfil.top = L/aspectRatio
        alzado.bottom = planta.bottom = perfil.bottom = -L/aspectRatio
    }
    // Alzado


    // Planta

    // Perfil


    //camera.left = -2*aspectRatio
    //camera.right = 2*aspectRatio

    alzado.updateProjectionMatrix();
    planta.updateProjectionMatrix()
    perfil.updateProjectionMatrix()
    camera.updateProjectionMatrix();
}

init()
loadScene()
render()