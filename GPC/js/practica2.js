let renderer, scene, camera;

function init() {
    renderer = new THREE.WebGLRenderer()
    renderer.setSize( window.innerWidth, window.innerHeight )
    renderer.setClearColor( new THREE.Color(0xAEAEAE), 1.0 )
    document.body.appendChild(renderer.domElement)

    scene = new THREE.Scene()

    let aspectRatio = window.innerWidth / window.innerHeight
    camera = new THREE.PerspectiveCamera( 75, aspectRatio, 0.1, 100 )
    camera.position.set( 0, 2, 3 )
}

function update() {

}

function render() {
    requestAnimationFrame(render)
    update()
    renderer.render(scene, camera)
}

init()
render()