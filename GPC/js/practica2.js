// Modulos necesarios
import * as THREE from "../lib/three.module.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot;
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
    camera = new THREE.PerspectiveCamera( 75, aspectRatio, 1, 3000 )
    camera.position.set( 150, 230, 0 )
    camera.lookAt(0, 120, 0)
    
    document.getElementById("top_view_button").addEventListener("click", () => {
        camera.position.set( 100, 300, 0 )
        camera.lookAt(0, 120, 0)
    })

    document.getElementById("front_view_button").addEventListener("click", () => {
        camera.position.set( 150, 230, 0 )
        camera.lookAt(0, 120, 0)
    })
    
}

function loadScene() {

    const material = new THREE.MeshBasicMaterial({
        color: "yellow",
        wireframe: true
    })

    // Suelo (perpendicular a eje Z por defecto)
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 10, 10), material)
    suelo.rotateX(-Math.PI/2)
    scene.add(suelo)

    // Brazo robot articulado
    robot = new THREE.Object3D()

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 15, 20), material)
    robot.add(base)
    scene.add(robot)

    // Brazo: eje + esparrago + rotula
    const brazo = new THREE.Object3D()
    robot.add(brazo)

    const eje = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 18, 20), material)
    eje.rotateX(-Math.PI/2)
    brazo.add(eje)

    const esparrago = new THREE.Mesh(new THREE.BoxGeometry(18, 120, 12), material)
    esparrago.position.y += 120/2
    brazo.add(esparrago)

    const esfera = new THREE.Mesh(new THREE.SphereGeometry(20, 15, 15), material)
    esfera.position.y += 120
    brazo.add(esfera)

    // Antebrazo: disco + (nervios * 4) + cilindro
    const antebrazo = new THREE.Object3D()
    antebrazo.position.y += 120
    brazo.add(antebrazo)

    const disco = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 6, 20), material)
    antebrazo.add(disco)

    const diffX = [-8, 8, -8, 8]
    const diffZ = [-8, 8, 8, -8]
    
    for (let i = 0; i < 4; i++) {
        const nervio = new THREE.Mesh(new THREE.BoxGeometry(4, 80, 4), material)
        nervio.position.x += diffX[i]
        nervio.position.z += diffZ[i]
        nervio.position.y += 80/2
        antebrazo.add(nervio)
    }

    // Mano: pinza izquierda + pinza derecha
    const mano = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 40, 20), material)
    mano.position.y += 80
    mano.rotateX(-Math.PI/2)
    antebrazo.add(mano)

    // Definicion del dedo usando BufferGeometry
    const dedoForma = new THREE.BufferGeometry()

    dedoForma.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
        0,20,4, 0,0,4, 19,5,4, 19,15,4,      // Back (0,1,2,3) 
        19,15,2, 19,5,2, 0,0,0, 0,20,0,      // Front (4,5,6,7)
        0,20,0, 0,0,0, 0,0,4, 0,20,4,        // Left (8,9,10,11)
        19,15,4, 19,5,4, 19,5,2, 19,15,2,    // Right (12,13,14,15)       
        0,20,4,19,15,4, 19,15,2, 0,20,0,     // Up (16,17,18,19)
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

    dedoForma.setIndex([
        0,1,2, 2,3,0,       // Back
        4,5,6, 6,7,4,       // Front
        8,9,10, 10,11,8,    // Left
        12,13,14, 14,15,12, // Right
        16,17,18, 18,19,16, // Up
        20,21,22, 22,23,20  // Down
    ])

    // Definicion de la pinza izquierda
    const pinzaIz = new THREE.Object3D()
    mano.add(pinzaIz)
    const palma = new THREE.Mesh(new THREE.BoxGeometry(19, 4, 20), material)
    palma.position.x += 17
    palma.position.y += 15
    pinzaIz.add(palma)

    const dedo = new THREE.Mesh(dedoForma, material);
    dedo.position.x += 17 + 19/2
    dedo.position.y += 15 + 4/2
    dedo.position.z -= 20/2
    dedo.rotation.x = Math.PI/2
    pinzaIz.add(dedo)

    // Definicion de la pinza derecha
    const pinzaDer = new THREE.Object3D()
    mano.add(pinzaDer)
    const palmaDer = new THREE.Mesh(new THREE.BoxGeometry(19, 4, 20), material)
    palmaDer.position.x += 17
    palmaDer.position.y -= 15
    pinzaDer.add(palmaDer)

    const dedoDer = new THREE.Mesh(dedoForma, material);
    dedoDer.position.x += 17 + 19/2
    dedoDer.position.y -= 15 + 4/2
    dedoDer.position.z += 20/2
    dedoDer.rotation.x = -Math.PI/2
    pinzaDer.add(dedoDer)

    // Helper de ejes
    scene.add(new THREE.AxesHelper(20))

}

const update = () => {
    const checkbox = document.getElementById("rotation_checkbox")
    if (checkbox.checked) {
        angulo += 0.01
        robot.rotation.y = angulo
    }
}

function render() {
    requestAnimationFrame(render)
    update()
    renderer.render(scene, camera)
}

init()
loadScene()
render()