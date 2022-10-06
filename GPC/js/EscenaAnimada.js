/**
 * EscenaMultivista.js
 * 
 * Seminario GPC#3. Visualizar una escena básica desde 4 camaras
 * en 4 marcos diferentes.
 * @author <rvivo@upv.es>
 * 
 * 
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js"
import {GUI} from "../lib/lil-gui.module.min.js"
import Stats from "../lib/stats.module.js"

// Variables estandar
let renderer, scene, camera;

// Otras globales
let esferaCubo;
let angulo = 0;
let cameraControls;
let movementController;

// Acciones
init();
loadScene();
setupGui();
render();

function init()
{
    // Instanciar el motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor(0xAAAAAA);
    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0.5,0.5,0.5);

    // Instanciar la camara perspectiva
    camera= new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,100);
    camera.position.set(0.5,2,7);

    cameraControls = new OrbitControls(camera,renderer.domElement);
    cameraControls.target.set(0,1,0);
    camera.lookAt(0,1,0);

    // Captura de eventos
    window.addEventListener('resize', updateAspectRatio );
    renderer.domElement.addEventListener('dblclick',rotateShape);

}

function loadScene()
{
    // Material sencillo
    const material = new THREE.MeshBasicMaterial({color:'yellow',wireframe:true});

    // Suelo
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(10,10, 10,10), material );
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = -0.2;
    scene.add(suelo);

    // Esfera y cubo
    const esfera = new THREE.Mesh( new THREE.SphereGeometry(1,20,20), material );
    const cubo = new THREE.Mesh( new THREE.BoxGeometry(2,2,2), material );
    esfera.position.x = 1;
    cubo.position.x = -1;

    esferaCubo = new THREE.Object3D();
    esferaCubo.add(esfera);
    esferaCubo.add(cubo);
    esferaCubo.position.y = 1.5;
    esferaCubo.name = "grupoEC";

    scene.add(esferaCubo);

    scene.add( new THREE.AxesHelper(3) );
    cubo.add( new THREE.AxesHelper(1) );

    // Modelos importados
    const loader = new THREE.ObjectLoader();
    loader.load('models/soldado/soldado.json', 
    function (objeto)
    {
        const soldado = new THREE.Object3D();
        soldado.add(objeto);
        cubo.add(soldado);
        soldado.position.y = 1;
        soldado.name = 'soldado';
    });

    const glloader = new GLTFLoader();
    glloader.load('models/RobotExpressive.glb',
    function(objeto)
    {
        esfera.add(objeto.scene);
        objeto.scene.scale.set(0.5,0.5,0.5);
        objeto.scene.position.y = 1;
        objeto.scene.rotation.y = -Math.PI/2;
        objeto.scene.name = 'robot';
        console.log("ROBOT");
        console.log(objeto);
    });


}

function updateAspectRatio()
{
    // Cambia las dimensiones del canvas
    renderer.setSize(window.innerWidth,window.innerHeight);

    // Nuevo relacion aspecto de la camara
    const ar = window.innerWidth/window.innerHeight;

    // perspectiva
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}

function update()
{
    angulo += 0.01;
    //esferaCubo.rotation.y = angulo;
    TWEEN.update()
}

function rotateShape(evento)
{
    // Capturar la posicion de doble click (S.R. top-left con Y down)
    let x = evento.clientX;
    let y = evento.clientY;

    // Normalizar las coordenadas de click al cuadrado de 2x2

    x = ( x / window.innerWidth ) * 2 - 1;
    y = -( y / window.innerHeight ) * 2 + 1;

    // Rayo e intersecciones
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2(x,y), camera);

    const soldado = scene.getObjectByName("soldado")
    let intersecciones = rayo.intersectObjects(soldado.children, true)
    if (intersecciones.length > 0) {
        new TWEEN.Tween(soldado.position)
        .to({ x: [0,0], y: [3,1], z: [0,0] }, 2000)
        .interpolation(TWEEN.Interpolation.Bezier)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start()
    }

    /*intersecciones = rayo.intersectObjects( 
        scene.getObjectByName('grupoEC').children,false );
    if(intersecciones.length>0)
        intersecciones[0].object.rotation.y += Math.PI / 8;*/
        
}

function render()
{
    requestAnimationFrame(render);
    update();
    renderer.render(scene,camera);
}