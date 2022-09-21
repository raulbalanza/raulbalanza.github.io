// Modulos necesarios
import * as THREE from "../lib/three.module"
import { GLTFLoader } from "../lib/GLTFLoader.module"

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

}

function render() {
    requestAnimationFrame(render)
    renderer.render(scene, camera)
}

init()
render()