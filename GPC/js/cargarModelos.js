// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import { GLTFLoader } from "../lib/GLTFLoader.module.js";
import { ColladaLoader } from "../lib/ColladaLoader.js"

let scene, fichas;
const y_suelo_fichas = 361.3

const loadAll = (scene_, fichas_) => {

    scene = scene_
    fichas = fichas_

    const colladaLoader = new ColladaLoader();
    
    // Tablero
    colladaLoader.load('models/tablero/model.dae', add_board);

    const gltfLoader = new GLTFLoader();

    // Mesa y sillas
    gltfLoader.load('models/metallic_garden_table.glb', add_table);
    // Personajes
    gltfLoader.load('models/jugadores.glb', add_players);
    // Dado
    gltfLoader.load('models/dado/scene.gltf', add_dice);
    // Fichas
    gltfLoader.load('models/ficha.glb', add_pawns);

}

const add_table = (objeto) => {
    objeto.scene.scale.set(10, 10, 10)
    scene.add(objeto.scene)
}

const add_dice = (objeto) => {

    const dado = objeto.scene
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

const add_players = (objeto) => {

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
    
}

export { loadAll }