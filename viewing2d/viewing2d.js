// Vertex shader source code
const vertexShaderSource = `
    attribute vec2 a_position;
    uniform mat3 u_modelMatrix;
    uniform mat3 u_viewingMatrix;

    void main() {
        gl_Position = vec4((u_viewingMatrix * u_modelMatrix * vec3(a_position,1.0)).xy, 0.0, 1.0);
    }
`;

// Fragment shader source code
const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 u_color;
    void main() {
        gl_FragColor = vec4(u_color,1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

function setSquareVertices(x,y,weight,height){
    return new Float32Array([
        x,y+height,
        x+weight,y+height,
        x+weight,y,
        x,y,
        x+weight,y,
        x,y+height
    ]);
}

function main() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const modelMatrixUniformLocation = gl.getUniformLocation(program,'u_modelMatrix');
    let modelMatrix = m3.identity();
    gl.uniformMatrix3fv(modelMatrixUniformLocation,false,modelMatrix);

    const viewingMatrixUniformLocation = gl.getUniformLocation(program,'u_viewingMatrix');
    let viewingMatrix = m3.setClippingWindow(-1,-1,1,1);
    gl.uniformMatrix3fv(viewingMatrixUniformLocation,false,viewingMatrix);

    const colorUniformLocation = gl.getUniformLocation(program,'u_color');
    let color = [0.0,0.0,0.0];
    gl.uniform3fv(colorUniformLocation,color);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const VertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, setSquareVertices(-0.5,-0.5,1,1), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    drawScene();
}

function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}

window.addEventListener('load', main);