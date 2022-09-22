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
    camera.position.set( 100, 300, 0 )
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

    robot = new THREE.Object3D()

    const base = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 15, 20), material)
    robot.add(base)
    scene.add(robot)

    const brazo = new THREE.Object3D()
    robot.add(brazo)

    const eje = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 18, 20), material)
    eje.rotateX(-Math.PI/2)
    brazo.add(eje)

    const esparrago = new THREE.Mesh(new THREE.BoxGeometry(12, 120, 18), material)
    esparrago.position.y += 120/2
    brazo.add(esparrago)

    const esfera = new THREE.Mesh(new THREE.SphereGeometry(20, 15, 15), material)
    esfera.position.y += 120
    brazo.add(esfera)

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

    const mano = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 40, 20), material)
    mano.position.y += 80
    mano.rotateX(-Math.PI/2)
    antebrazo.add(mano)

    // Definicion del dedo usando BufferGeometry
    const dedoForma = new THREE.BufferGeometry()

    dedoForma.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
        0,0,0, 19,-5,0, 19,-15,0, 0,-20,0, 0,0,4, 19,-5,2, 19,-15,2, 0,-20,4
    ]), 3))
    dedoForma.setIndex([ 0,1,3,1,3,2, 4,5,7,5,7,6, 0,4,3, 1,5,0, 2,6,3, 3,7,2 ])

    // Definicion de la pinza izquierda
    const pinzaIz = new THREE.Object3D()
    mano.add(pinzaIz)
    const palma = new THREE.Mesh(new THREE.BoxGeometry(19, 4, 20), material)
    palma.position.x += 17
    palma.position.y += 15
    pinzaIz.add(palma)

    const dedo = new THREE.Mesh(dedoForma, material);
    dedo.position.x += 17 + 19/2
    dedo.position.y += 15 - 4/2
    dedo.position.z -= 20/2
    dedo.rotation.x = -Math.PI/2
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
    dedoDer.position.y -= 15 - 4/2
    dedoDer.position.z += 20/2
    dedoDer.rotation.x = Math.PI/2
    pinzaDer.add(dedoDer)

    // Helper de ejes
    scene.add(new THREE.AxesHelper(3))

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