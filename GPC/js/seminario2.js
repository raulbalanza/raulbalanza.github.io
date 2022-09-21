// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import { GLTFLoader } from "../lib/GLTFLoader.module.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let esferaCubo;
let angulo = 0;

function init() {

    // Instanciar el motor
    renderer = new THREE.WebGLRenderer()
    renderer.setSize( window.innerWidth, window.innerHeight )
    document.getElementById("container").appendChild(renderer.domElement)

    // Instanciar la escena
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0.5, 0.5, 0.5)

    // Instanciar la camara
    let aspectRatio = window.innerWidth / window.innerHeight
    camera = new THREE.PerspectiveCamera( 75, aspectRatio, 0.1, 100 )
    camera.position.set( 0.5, 2, 7 )
    
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
    renderer.render(scene, camera)
}

init()
loadScene()
render()