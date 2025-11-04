// Vertex shader source code
const vertexShaderSource = `
    attribute vec3 a_position;
    attribute vec3 a_color;
    attribute vec3 a_normal;
    
    varying vec3 v_color;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;
    
    uniform mat4 u_modelViewMatrix;
    uniform mat4 u_viewingMatrix;
    uniform mat4 u_projectionMatrix;
    

    uniform vec3 u_lightPosition;
    uniform vec3 u_viewPosition;

    void main() {
        gl_Position = u_projectionMatrix * u_viewingMatrix * u_modelViewMatrix * vec4(a_position,1.0);
        v_normal = mat3(u_modelViewMatrix) * a_normal;
        vec3 surfacePosition = (u_modelViewMatrix * vec4(a_position, 1)).xyz;
        v_surfaceToLight = u_lightPosition - surfacePosition;
        v_surfaceToView = u_viewPosition - surfacePosition;
        v_color = a_color;
    }
`;

// Fragment shader source code
const fragmentShaderSource = `
    precision mediump float;
    
    varying vec3 v_color;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    
    void main() {
      vec3 ambientReflection = v_color;
      vec3 diffuseReflection = v_color;
      vec3 specularReflection = vec3(1.0,1.0,1.0);

      gl_FragColor = vec4(diffuseReflection, 1);

      vec3 normal = normalize(v_normal);
      vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
      vec3 surfaceToViewDirection = normalize(v_surfaceToView);
      vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

      float light = dot(surfaceToLightDirection,normal);
      float specular = 0.0;
      if (light > 0.0) {
        specular = pow(dot(normal, halfVector), 250.0);
      }

      gl_FragColor.rgb = 0.4*ambientReflection + 0.6*light*diffuseReflection;
      gl_FragColor.rgb += specular*specularReflection;
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

function setCubeNormals(){
  return new Float32Array([
      // Front
      0.0,0.0,1.0,
      0.0,0.0,1.0,
      0.0,0.0,1.0,
      0.0,0.0,1.0,
      0.0,0.0,1.0,
      0.0,0.0,1.0,
  
      // Left
      -1.0,0.0,0.0,
      -1.0,0.0,0.0,
      -1.0,0.0,0.0,
      -1.0,0.0,0.0,
      -1.0,0.0,0.0,
      -1.0,0.0,0.0,
  
      // Back
      0.0,0.0,-1.0,
      0.0,0.0,-1.0,
      0.0,0.0,-1.0,
      0.0,0.0,-1.0,
      0.0,0.0,-1.0,
      0.0,0.0,-1.0,
  
      // Right
      1.0,0.0,0.0,
      1.0,0.0,0.0,
      1.0,0.0,0.0,
      1.0,0.0,0.0,
      1.0,0.0,0.0,
      1.0,0.0,0.0,
  
      // Top
      0.0,1.0,0.0,
      0.0,1.0,0.0,
      0.0,1.0,0.0,
      0.0,1.0,0.0,
      0.0,1.0,0.0,
      0.0,1.0,0.0,
  
      // Bottom
      0.0,-1.0,0.0,
      0.0,-1.0,0.0,
      0.0,-1.0,0.0,
      0.0,-1.0,0.0,
      0.0,-1.0,0.0,
      0.0,-1.0,0.0,
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
    const normalLocation = gl.getAttribLocation(program, 'a_normal');

    const VertexBuffer = gl.createBuffer();
    let cubeVertices = [];

    const ColorBuffer = gl.createBuffer();
    let cubeColors = [];

    const NormalBuffer = gl.createBuffer();
    let cubeNormals = [];
    
    const modelViewMatrixUniformLocation = gl.getUniformLocation(program,'u_modelViewMatrix');
    const viewingMatrixUniformLocation = gl.getUniformLocation(program,'u_viewingMatrix');
    const projectionMatrixUniformLocation = gl.getUniformLocation(program,'u_projectionMatrix');

    const lightPositionUniformLocation = gl.getUniformLocation(program,'u_lightPosition');
    const viewPositionUniformLocation = gl.getUniformLocation(program,'u_viewPosition');

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let modelViewMatrix = m4.identity();

    let P0 = [2.0,2.0,2.0];
    let Pref = [0.0,0.0,0.0];
    let V = [0.0,1.0,0.0];
    let viewingMatrix = m4.setViewingMatrix(P0,Pref,V);
    
    gl.uniform3fv(viewPositionUniformLocation, new Float32Array(P0));
    gl.uniform3fv(lightPositionUniformLocation, new Float32Array([0.0,0.0,1.0]));

    let xw_min = -1.0;
    let xw_max = 1.0;
    let yw_min = -1.0;
    let yw_max = 1.0;
    let z_near = -1.0;
    let z_far = -8.0;

    let projectionMatrix = m4.setOrthographicProjectionMatrix(xw_min,xw_max,yw_min,yw_max,z_near,z_far);

    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown",keyDown,false);
  
    function keyDown(event){
      event.preventDefault();
      switch(event.key){
        case '1':
          projectionMatrix = m4.setOrthographicProjectionMatrix(xw_min,xw_max,yw_min,yw_max,z_near,z_far);
          break;
        case '2':
          projectionMatrix = m4.setPerspectiveProjectionMatrix(xw_min,xw_max,yw_min,yw_max,z_near,z_far);
          break;
      }
    }

    let theta = 0.0;
    let tx = 0.0;
    let ty = 0.0;
    let tz = 0.0;
    let tx_offset = 0.02;

    cubeColors = setCubeColors();
    cubeVertices = setCubeVertices(0.5);
    cubeNormals = setCubeNormals();

    function drawCube(){
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  
      gl.enableVertexAttribArray(colorLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, ColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

      gl.enableVertexAttribArray(normalLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, cubeNormals, gl.STATIC_DRAW);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
      
      modelViewMatrix = m4.identity();
      modelViewMatrix = m4.yRotate(modelViewMatrix,degToRad(theta));
      modelViewMatrix = m4.translate(modelViewMatrix,tx,ty,tz);

      gl.uniformMatrix4fv(modelViewMatrixUniformLocation,false,modelViewMatrix);
      gl.uniformMatrix4fv(viewingMatrixUniformLocation,false,viewingMatrix);
      gl.uniformMatrix4fv(projectionMatrixUniformLocation,false,projectionMatrix);

      gl.uniform3fv(viewPositionUniformLocation, new Float32Array(P0));
      gl.uniform3fv(lightPositionUniformLocation, new Float32Array([0.0,0.0,1.0]));

      gl.drawArrays(gl.TRIANGLES, 0, 6*6);
    }

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT);

      theta += 2;
      if(tx>2.0 || tx<-2.0)
        tx_offset = -tx_offset;
      tx += tx_offset;

      gl.viewport(0, 0, gl.canvas.width/2, gl.canvas.height);
      P0 = [0.0,0.0,2.0];
      Pref = [0.0,0.0,0.0];
      V = [0.0,1.0,0.0];
      viewingMatrix = m4.setViewingMatrix(P0,Pref,V);
      drawCube();

      gl.viewport(gl.canvas.width/2, 0, gl.canvas.width/2, gl.canvas.height);
      P0 = [2.0,1.0,2.0];
      Pref = [0.0,0.0,0.0];
      V = [0.0,1.0,0.0];
      viewingMatrix = m4.setViewingMatrix(P0,Pref,V);
      drawCube();

      requestAnimationFrame(drawScene);
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