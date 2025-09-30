// Vertex shader source code
const vertexShaderSource = `
    attribute vec3 a_position;
    attribute vec3 a_color;
    varying vec3 v_color;
    uniform mat4 u_matrix;

    void main() {
        gl_Position = u_matrix * vec4(a_position,1.0);
        v_color = a_color;
    }
`;

// Fragment shader source code
const fragmentShaderSource = `
    precision mediump float;
    varying vec3 v_color;
    void main() {
        gl_FragColor = vec4(v_color,1.0);
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

function setCubeVertices(side){
  let v = side/2;
  return new Float32Array([
      // Front
      v, v, v,
      v, -v, v,
      -v, v, v,
      -v, v, v,
      v, -v, v,
      -v, -v, v,
  
      // Left
      -v, v, v,
      -v, -v, v,
      -v, v, -v,
      -v, v, -v,
      -v, -v, v,
      -v, -v, -v,
  
      // Back
      -v, v, -v,
      -v, -v, -v,
      v, v, -v,
      v, v, -v,
      -v, -v, -v,
      v, -v, -v,
  
      // Right
      v, v, -v,
      v, -v, -v,
      v, v, v,
      v, v, v,
      v, -v, v,
      v, -v, -v,
  
      // Top
      v, v, v,
      v, v, -v,
      -v, v, v,
      -v, v, v,
      v, v, -v,
      -v, v, -v,
  
      // Bottom
      v, -v, v,
      v, -v, -v,
      -v, -v, v,
      -v, -v, v,
      v, -v, -v,
      -v, -v, -v,
  ]);
}

function setCubeColors(){
  let colors = [];
  let color = [];
  for(let i=0;i<6;i++){
    color = [Math.random(),Math.random(),Math.random()];
    for(let j=0;j<6;j++)
      colors.push(...color);
  }

  return new Float32Array(colors);
}

function defineRotationMatrix(P1,P2,theta){
    let m = m4.identity();

    let V = [P2[0]-P1[0],P2[1]-P1[1],P2[2]-P1[2]];
    let v = unitVector(V);

    //parallel to z-axis
    if(v[0]==0 && v[1]==0){
        m = m4.multiply(m4.translation(-P1[0],-P1[1],-P1[2]),m);  
        m = m4.multiply(m4.zRotation(degToRad(theta)),m);
        m = m4.multiply(m4.translation(P1[0],P1[1],P1[2]),m);
        return m;
    }

    //parallel to y-axis
    if(v[0]==0 && v[2]==0){
        m = m4.multiply(m4.translation(-P1[0],-P1[1],-P1[2]),m);
        m = m4.multiply(m4.yRotation(degToRad(theta)),m);
        m = m4.multiply(m4.translation(P1[0],P1[1],P1[2]),m);
        return m;
    }

    //parallel to x-axis
    if(v[1]==0 && v[2]==0){
        m = m4.multiply(m4.translation(-P1[0],-P1[1],-P1[2]),m);
        m = m4.multiply(m4.xRotation(degToRad(theta)),m);
        m = m4.multiply(m4.translation(P1[0],P1[1],P1[2]),m);
        return m;
    }

    let a = v[0];
    let b = v[1];
    let c = v[2];
    let d = Math.sqrt(Math.pow(b,2)+Math.pow(c,2));

    let T_p1_origin = [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        -P1[0], -P1[1], -P1[2], 1.0
    ];

    let Rx_alpha = [
        1.0, 0.0, 0.0, 0.0,
        0.0, c/d, b/d, 0.0,
        0.0, -b/d, c/d, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];

    let Ry_beta = [
        d, 0.0, a, 0.0,
        0.0, 1.0, 0.0, 0.0,
        -a, 0.0, d, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];

    let Rz_theta = m4.zRotation(degToRad(theta));

    let T_origin_p1 = [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        P1[0], P1[1], P1[2], 1.0
    ];
    
    m = m4.multiply(T_p1_origin,m);
    m = m4.multiply(Rx_alpha,m);
    m = m4.multiply(Ry_beta,m);
    m = m4.multiply(Rz_theta,m);
    m = m4.multiply(m4.transpose(Ry_beta),m);
    m = m4.multiply(m4.transpose(Rx_alpha),m);
    m = m4.multiply(T_origin_p1,m);

    return m;
}

function defineCoordinateAxes(){
    return new Float32Array([
      // X axis
      -1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      // Y axis
      0.0, -1.0, 0.0,
      0.0, 1.0, 0.0,
      // Z axis
      0.0, 0.0, -1.0,
      0.0, 0.0, 1.0,
    ]);
}

function defineCoordinateAxesColors(){
    return new Float32Array([
      // X axis
      0.25, 0.25, 0.25,
      0.25, 0.25, 0.25,
      // Y axis
      0.25, 0.25, 0.25,
      0.25, 0.25, 0.25,
      // Z axis
      0.25, 0.25, 0.25,
      0.25, 0.25, 0.25,
    ]);
}

function defineGenericRotationAxis(P1,P2){
    let v = unitVector([P2[0]-P1[0],P2[1]-P1[1],P2[2]-P1[2]]);
    
    return new Float32Array([
      P1[0]+5*v[0], P1[1]+5*v[1], P1[2]+5*v[2],
      P1[0]-5*v[0], P1[1]-5*v[1], P1[2]-5*v[2],
    ]);
}

function defineGenericRotationAxisColors(){
    return new Float32Array([
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
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

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getAttribLocation(program, 'a_color');

    const VertexBuffer = gl.createBuffer();
    let cubeVertices = setCubeVertices(0.25);
    console.log(cubeVertices.length);

    const ColorBuffer = gl.createBuffer();
    let cubeColors = setCubeColors();
    console.log(cubeColors.length);
    
    const matrixUniformLocation = gl.getUniformLocation(program,'u_matrix');
    let matrix = m4.identity();
    gl.uniformMatrix4fv(matrixUniformLocation,false,matrix);

    let theta = 0.0;
    let P1 = [0.0,0.0,1.0];
    let P2 = [0.0,0.0,-1.0];
    let coordinateAxes = defineCoordinateAxes();
    let coordinateAxesColors = defineCoordinateAxesColors();

    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown",keyDown,false);
  
    function keyDown(event){
      switch(event.key){
        case 'ArrowDown':
          theta += 5.0;
          break;
        case 'ArrowUp':
          theta -= 5.0;
          break;
        default:
          return;
      }
      drawScene();
    }

    const buttonElement = document.getElementById("ler_P1_P2");
    buttonElement.addEventListener("click", onClick);
    
    function onClick(event){
        let x1 = parseFloat(document.getElementById("x1").value);
        let y1 = parseFloat(document.getElementById("y1").value);
        let z1 = parseFloat(document.getElementById("z1").value);
        let x2 = parseFloat(document.getElementById("x2").value);
        let y2 = parseFloat(document.getElementById("y2").value);
        let z2 = parseFloat(document.getElementById("z2").value);
        P1 = [x1,y1,z1];
        P2 = [x2,y2,z2];
        theta = 0.0;
        drawScene();
    }

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    function drawCube(){
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(colorLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, ColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
      let rotationMatrix = defineRotationMatrix(P1,P2,theta);
      gl.uniformMatrix4fv(matrixUniformLocation,false,rotationMatrix);
      gl.drawArrays(gl.TRIANGLES, 0, 6*6);
    }

    function drawCoordinateAxes(){
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, coordinateAxes, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(colorLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, ColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, coordinateAxesColors, gl.STATIC_DRAW);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
      let matrix = m4.identity();
      gl.uniformMatrix4fv(matrixUniformLocation,false,matrix);
      gl.drawArrays(gl.LINES, 0, 6);
    }

    function drawGenericRotationAxis(){
      let genericRotationAxis = defineGenericRotationAxis(P1,P2);
      let genericRotationAxisColors = defineGenericRotationAxisColors();
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, genericRotationAxis, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(colorLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, ColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, genericRotationAxisColors, gl.STATIC_DRAW);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
      let matrix = m4.identity();
      gl.uniformMatrix4fv(matrixUniformLocation,false,matrix);
      gl.drawArrays(gl.LINES, 0, 2);
    }

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT);
      drawCube();
      drawCoordinateAxes();
      drawGenericRotationAxis();
    }

    drawScene();
}

function unitVector(v){ 
    let vModulus = vectorModulus(v);
    return v.map(function(x) { return x/vModulus; });
}

function vectorModulus(v){
    return Math.sqrt(Math.pow(v[0],2)+Math.pow(v[1],2)+Math.pow(v[2],2));
}

function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}

window.addEventListener('load', main);