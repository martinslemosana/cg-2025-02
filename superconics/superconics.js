// Vertex shader source code
const vertexShaderSource = `
    attribute vec3 a_position;
    attribute vec3 a_normal;
    
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
    }
`;

// Fragment shader source code
const fragmentShaderSource = `
    precision mediump float;
    
    uniform vec3 u_color;

    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    
    void main() {
      vec3 ambientReflection = u_color;
      vec3 diffuseReflection = u_color;
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

      gl_FragColor.rgb = 0.5*ambientReflection + 0.5*light*diffuseReflection;
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

function setSuperConicSphereVertices(radius, slices, stacks, s1, s2) {
  const vertexData = [];
  let slicesStep = (2 * Math.PI) / slices;
  let stacksStep = Math.PI / stacks;

  for (let i = 0; i < stacks; i++) {
      let phi = -Math.PI / 2 + i * stacksStep;
      for (let j = 0; j < slices; j++) {
          let theta = -Math.PI + j * slicesStep;
          vertexData.push(...[
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), s2),
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), s2),
              radius * Math.sign(Math.sin(phi)) * Math.pow(Math.abs(Math.sin(phi)), s1)
          ]);
          vertexData.push(...[
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), s2),
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), s2),
              radius * Math.sign(Math.sin(phi + stacksStep)) * Math.pow(Math.abs(Math.sin(phi + stacksStep)), s1)
          ]);
          vertexData.push(...[
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.cos(theta + slicesStep)) * Math.pow(Math.abs(Math.cos(theta + slicesStep)), s2),
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.sin(theta + slicesStep)) * Math.pow(Math.abs(Math.sin(theta + slicesStep)), s2),
              radius * Math.sign(Math.sin(phi)) * Math.pow(Math.abs(Math.sin(phi)), s1)
          ]);
          vertexData.push(...[
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), s2),
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), s2),
              radius * Math.sign(Math.sin(phi + stacksStep)) * Math.pow(Math.abs(Math.sin(phi + stacksStep)), s1)
          ]);
          vertexData.push(...[
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.cos(theta + slicesStep)) * Math.pow(Math.abs(Math.cos(theta + slicesStep)), s2),
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.sin(theta + slicesStep)) * Math.pow(Math.abs(Math.sin(theta + slicesStep)), s2),
              radius * Math.sign(Math.sin(phi + stacksStep)) * Math.pow(Math.abs(Math.sin(phi + stacksStep)), s1)
          ]);
          vertexData.push(...[
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.cos(theta + slicesStep)) * Math.pow(Math.abs(Math.cos(theta + slicesStep)), s2),
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.sin(theta + slicesStep)) * Math.pow(Math.abs(Math.sin(theta + slicesStep)), s2),
              radius * Math.sign(Math.sin(phi)) * Math.pow(Math.abs(Math.sin(phi)), s1)
          ]);
      }
  }

  return new Float32Array(vertexData);
}

function setSuperConicSphereNormals_flat(radius, slices, stacks, s1, s2) {
  const normalData = [];
  let slicesStep = (2 * Math.PI) / slices;
  let stacksStep = Math.PI / stacks;

  let theta = -Math.PI;
  let phi = -Math.PI / 2;

  for (let i = 0; i < stacks; i++) {
      let phi = -Math.PI / 2 + i * stacksStep;
      for (let j = 0; j < slices; j++) {
          let theta = -Math.PI + j * slicesStep;
          P0 = [
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), s2),
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), s2),
              radius * Math.sign(Math.sin(phi)) * Math.pow(Math.abs(Math.sin(phi)), s1)
          ];
          P1 = [
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), s2),
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), s2),
              radius * Math.sign(Math.sin(phi + stacksStep)) * Math.pow(Math.abs(Math.sin(phi + stacksStep)), s1)
          ];
          P2 = [
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.cos(theta + slicesStep)) * Math.pow(Math.abs(Math.cos(theta + slicesStep)), s2),
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.sin(theta + slicesStep)) * Math.pow(Math.abs(Math.sin(theta + slicesStep)), s2),
              radius * Math.sign(Math.sin(phi)) * Math.pow(Math.abs(Math.sin(phi)), s1)
          ];
          N = crossProduct([P2[0] - P0[0], P2[1] - P0[1], P2[2] - P0[2]], [P1[0] - P0[0], P1[1] - P0[1], P1[2] - P0[2]]);
          normalData.push(...N);
          normalData.push(...N);
          normalData.push(...N);

          P0 = [
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), s2),
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.sin(theta)) * Math.pow(Math.abs(Math.sin(theta)), s2),
              radius * Math.sign(Math.sin(phi + stacksStep)) * Math.pow(Math.abs(Math.sin(phi + stacksStep)), s1)
          ];
          P1 = [
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.cos(theta + slicesStep)) * Math.pow(Math.abs(Math.cos(theta + slicesStep)), s2),
              radius * Math.sign(Math.cos(phi + stacksStep)) * Math.pow(Math.abs(Math.cos(phi + stacksStep)), s1) * Math.sign(Math.sin(theta + slicesStep)) * Math.pow(Math.abs(Math.sin(theta + slicesStep)), s2),
              radius * Math.sign(Math.sin(phi + stacksStep)) * Math.pow(Math.abs(Math.sin(phi + stacksStep)), s1)
          ];
          P2 = [
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.cos(theta + slicesStep)) * Math.pow(Math.abs(Math.cos(theta + slicesStep)), s2),
              radius * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), s1) * Math.sign(Math.sin(theta + slicesStep)) * Math.pow(Math.abs(Math.sin(theta + slicesStep)), s2),
              radius * Math.sign(Math.sin(phi)) * Math.pow(Math.abs(Math.sin(phi)), s1)
          ];
          N = crossProduct([P2[0] - P0[0], P2[1] - P0[1], P2[2] - P0[2]], [P1[0] - P0[0], P1[1] - P0[1], P1[2] - P0[2]]);
          normalData.push(...N);
          normalData.push(...N);
          normalData.push(...N);
      }
  }

  return new Float32Array(normalData);
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
    const normalLocation = gl.getAttribLocation(program, 'a_normal');

    const VertexBuffer = gl.createBuffer();
    let conicVertices = [];

    const NormalBuffer = gl.createBuffer();
    let conicNormals = [];
    
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');

    const modelViewMatrixUniformLocation = gl.getUniformLocation(program,'u_modelViewMatrix');
    const viewingMatrixUniformLocation = gl.getUniformLocation(program,'u_viewingMatrix');
    const projectionMatrixUniformLocation = gl.getUniformLocation(program,'u_projectionMatrix');

    const lightPositionUniformLocation = gl.getUniformLocation(program,'u_lightPosition');
    const viewPositionUniformLocation = gl.getUniformLocation(program,'u_viewPosition');

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let modelViewMatrix = m4.identity();

    let P0 = [1.0,1.0,1.0];
    let Pref = [0.0,0.0,0.0];
    let V = [0.0,1.0,0.0];
    let viewingMatrix = m4.setViewingMatrix(P0,Pref,V);
    
    gl.uniform3fv(viewPositionUniformLocation, new Float32Array(P0));
    gl.uniform3fv(lightPositionUniformLocation, new Float32Array([1.0,1.0,1.0]));

    let xw_min = -1.0;
    let xw_max = 1.0;
    let yw_min = -1.0;
    let yw_max = 1.0;
    let z_near = -1.0;
    let z_far = -8.0;

    let projectionMatrix = m4.setOrthographicProjectionMatrix(xw_min,xw_max,yw_min,yw_max,z_near,z_far);

    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown",keyDown,false);

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    function keyDown(event){
      event.preventDefault();
      switch(event.key){
        case '1':
          projectionMatrix = m4.setOrthographicProjectionMatrix(xw_min,xw_max,yw_min,yw_max,z_near,z_far);
          break;
        case '2':
          projectionMatrix = m4.setPerspectiveProjectionMatrix(xw_min,xw_max,yw_min,yw_max,z_near,z_far);
          break;
        case 'x':
          rotateX = 1;
          rotateY = 0;
          rotateZ = 0;
          break;
        case 'y':
          rotateX = 0;
          rotateY = 1;
          rotateZ = 0;
          break;
        case 'z':
          rotateX = 0;
          rotateY = 0;
          rotateZ = 1;
          break;
      }
    }

    const n_slices_stacks = document.querySelector("#value_slices_stacks");
    const input_slices_stacks = document.querySelector("#n_slices_stacks");
    n_slices_stacks.textContent = input_slices_stacks.value;

    const s1 = document.querySelector("#value_s1");
    const input_s1 = document.querySelector("#n_s1");
    s1.textContent = input_s1.value;
    let radius = 0.5;

    const s2 = document.querySelector("#value_s2");
    const input_s2 = document.querySelector("#n_s2");
    s2.textContent = input_s2.value;

    input_slices_stacks.addEventListener("input", (event) => {
        n_slices_stacks.textContent = event.target.value;

        conicVertices = setSuperConicSphereVertices(radius, n_slices_stacks.textContent, n_slices_stacks.textContent, s1.textContent, s2.textContent);
        conicNormals = setSuperConicSphereNormals_flat(radius, n_slices_stacks.textContent, n_slices_stacks.textContent, s1.textContent, s2.textContent);
    });

    input_s1.addEventListener("input", (event) => {
        s1.textContent = event.target.value;

        conicVertices = setSuperConicSphereVertices(radius, n_slices_stacks.textContent, n_slices_stacks.textContent, s1.textContent, s2.textContent);
        conicNormals = setSuperConicSphereNormals_flat(radius, n_slices_stacks.textContent, n_slices_stacks.textContent, s1.textContent, s2.textContent);
    });

    input_s2.addEventListener("input", (event) => {
        s2.textContent = event.target.value;

        conicVertices = setSuperConicSphereVertices(radius, n_slices_stacks.textContent, n_slices_stacks.textContent, s1.textContent, s2.textContent);
        conicNormals = setSuperConicSphereNormals_flat(radius, n_slices_stacks.textContent, n_slices_stacks.textContent, s1.textContent, s2.textContent);
    });

    let theta_x = 0.0;
    let theta_y = 0.0;
    let theta_z = 0.0;

    color = [1.0,0.0,0.0];
    conicVertices = setSuperConicSphereVertices(radius, n_slices_stacks.textContent, n_slices_stacks.textContent, s1.textContent, s2.textContent);
    conicNormals = setSuperConicSphereNormals_flat(radius, n_slices_stacks.textContent, n_slices_stacks.textContent, s1.textContent, s2.textContent);

    function drawConic(){
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, conicVertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

      gl.enableVertexAttribArray(normalLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, conicNormals, gl.STATIC_DRAW);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
      
      modelViewMatrix = m4.identity();
      modelViewMatrix = m4.xRotate(modelViewMatrix,degToRad(theta_x));
      modelViewMatrix = m4.yRotate(modelViewMatrix,degToRad(theta_y));
      modelViewMatrix = m4.zRotate(modelViewMatrix,degToRad(theta_z));

      gl.uniformMatrix4fv(modelViewMatrixUniformLocation,false,modelViewMatrix);
      gl.uniformMatrix4fv(viewingMatrixUniformLocation,false,viewingMatrix);
      gl.uniformMatrix4fv(projectionMatrixUniformLocation,false,projectionMatrix);

      gl.uniform3fv(colorUniformLocation, new Float32Array(color));
      gl.uniform3fv(viewPositionUniformLocation, new Float32Array(P0));
      gl.uniform3fv(lightPositionUniformLocation, new Float32Array([1.0,1.0,1.0]));

      gl.drawArrays(gl.TRIANGLES, 0, conicVertices.length / 3);
    }

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (rotateX)
        theta_x += 2;
      if (rotateY)
        theta_y += 2;
      if (rotateZ)
        theta_z += 2;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      P0 = [0.0,0.0,2.0];
      Pref = [0.0,0.0,0.0];
      V = [0.0,1.0,0.0];
      viewingMatrix = m4.setViewingMatrix(P0,Pref,V);
      drawConic();

      requestAnimationFrame(drawScene);
    }

    drawScene();
}

function crossProduct(v1, v2) {
  let result = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0]
  ];
  return result;
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