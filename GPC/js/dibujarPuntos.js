/*
    Seminario #1: Dibujar puntos con VBOs
*/

// Shader de vertices
const VSHADER_SOURCE = `
    attribute vec4 dist_color;
    attribute vec3 posicion;
    varying highp vec4 colorVec;
    void main(){
        gl_Position = vec4(posicion,1.0);
        gl_PointSize = 10.0;
        colorVec = dist_color;
    }
`

// Shader de fragmentos
const FSHADER_SOURCE = `
    varying highp vec4 colorVec;
    void main(){
        gl_FragColor = colorVec;
    }
`
// Globales
const SQRT_2 = Math.sqrt(2);

const clicks = [];
const colores = [];
let bufferVertices;

function main()
{
    // Recupera el lienzo
    const canvas = document.getElementById("canvas");
    const gl = getWebGLContext( canvas );

    // Cargo shaders en programa de GPU
    if(!initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE)){
        console.error("Te mamaste amigo");
    }

    // Color de borrado del lienzo
    gl.clearColor(0.0, 0.0, 0.3, 1.0);

    // Localiza el att del shader posicion
    const coordenadas = gl.getAttribLocation( gl.program, 'posicion');

    // Crea buffer, etc ...
    bufferVertices = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferVertices );
    gl.vertexAttribPointer( coordenadas, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( coordenadas );

    // Registrar la call-back del click del raton
    canvas.onmousedown = function(evento){ click(evento,gl,canvas); };

    // Dibujar
    render( gl );
    
}

function click( evento, gl, canvas )
{
    // Recuperar la posicion del click
    // El click devuelve la x,y en el sistema de referencia
    // del documento. Los puntos que se pasan al shader deben
    // de estar en el cuadrado de lado dos centrado en el canvas

    let x = evento.clientX;
    let y = evento.clientY;
    const rect = evento.target.getBoundingClientRect();

    // Conversion de coordenadas al sistema webgl por defecto
    x = ((x-rect.left)-canvas.width/2) * 2/canvas.width;
    y = ( canvas.height/2 - (y-rect.top)) * 2/canvas.height;
	
	// Guardar las coordenadas y copia el array
	clicks.push(x); clicks.push(y); clicks.push(0.0);
    colores.push(0); colores.push(0); colores.push(0);

    const dist = Math.sqrt(x*x + y*y);
    colores.push(dist/SQRT_2);

	// Redibujar con cada click
	render( gl );
}

function render( gl )
{
	// Borra el canvas con el color de fondo
	gl.clear( gl.COLOR_BUFFER_BIT );

	// Fija el color de TODOS los puntos
    const colorAttrib = gl.getAttribLocation( gl.program, 'dist_color' );

    const bufferColores = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColores);
    gl.vertexAttribPointer( colorAttrib, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( colorAttrib );
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colores), gl.STATIC_DRAW);

	// Rellena el BO activo con las coordenadas y lo manda a proceso
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertices);
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(clicks), gl.STATIC_DRAW );
	gl.drawArrays( gl.POINTS, 0, clicks.length/3 )	
    gl.drawArrays( gl.LINE_STRIP, 0, clicks.length/3 )	
}