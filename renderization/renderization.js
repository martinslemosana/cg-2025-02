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
    uniform mat4 u_inverseTransposeModelViewMatrix;
    

    uniform vec3 u_lightPosition;
    uniform vec3 u_viewPosition;

    void main() {
        gl_Position = u_projectionMatrix * u_viewingMatrix * u_modelViewMatrix * vec4(a_position,1.0);
        v_normal = normalize(mat3(u_inverseTransposeModelViewMatrix) * a_normal);
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

function createSphereSmooth(radius = 1, latBands = 30, longBands = 30) { 
    const positions = []; 
    const normals = []; 
    const indices = []; 
    for (let lat = 0; lat <= latBands; lat++) { 
        const phi = (lat * Math.PI) / latBands; // 0 → π 
        const cosPhi = Math.cos(phi); 
        const sinPhi = Math.sin(phi); 
        for (let lon = 0; lon <= longBands; lon++) { 
            const theta = (lon * 2 * Math.PI) / longBands; // 0 → 2π 
            const cosTheta = Math.cos(theta); 
            const sinTheta = Math.sin(theta); 
            const x = sinPhi * cosTheta; 
            const y = cosPhi; 
            const z = sinPhi * sinTheta; 
            // Vértice da esfera 
            positions.push(radius * x, radius * y, radius * z); 
            // Normal (igual ao vetor posição, pois a esfera é centrada na origem) 
            normals.push(x, y, z); 
        } 
    } 
    // Geração dos índices (triângulos) 
    for (let lat = 0; lat < latBands; lat++) { 
        for (let lon = 0; lon < longBands; lon++) { 
            const first = lat * (longBands + 1) + lon; 
            const second = first + longBands + 1; 
            indices.push(first, second, first + 1); 
            indices.push(second, second + 1, first + 1); 
        } 
    } 
    return { positions, normals, indices }; 
}

function createSphereFlat(radius = 1, latBands = 30, longBands = 30) {
  const positions = [];
  const normals = [];
  const indices = [];

  // usamos índice incremental porque cada face tem vértices duplicados (flat shading)
  let index = 0;

  for (let lat = 0; lat < latBands; lat++) {
    // phi atual e o próximo (formam a "faixa" de latitude)
    const phi = (lat * Math.PI) / latBands;           // phi
    const phiNext = ((lat + 1) * Math.PI) / latBands; // phi + 1

    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const cosPhiNext = Math.cos(phiNext);
    const sinPhiNext = Math.sin(phiNext);

    for (let lon = 0; lon < longBands; lon++) {
      // theta atual e o próximo (formam a "fatia" de longitude)
      const theta = (lon * 2 * Math.PI) / longBands;
      const thetaNext = ((lon + 1) * 2 * Math.PI) / longBands;

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const cosThetaNext = Math.cos(thetaNext);
      const sinThetaNext = Math.sin(thetaNext);

      // quatro vértices do "quad" (ordem consistente)
      const v1 = [radius * sinPhi * cosTheta, radius * cosPhi, radius * sinPhi * sinTheta];
      const v2 = [radius * sinPhiNext * cosTheta, radius * cosPhiNext, radius * sinPhiNext * sinTheta];
      const v3 = [radius * sinPhiNext * cosThetaNext, radius * cosPhiNext, radius * sinPhiNext * sinThetaNext];
      const v4 = [radius * sinPhi * cosThetaNext, radius * cosPhi, radius * sinPhi * sinThetaNext];

      // duas faces formando o quad: (v1,v2,v3) e (v1,v3,v4)
      const tri1 = [v1, v2, v3];
      const tri2 = [v1, v3, v4];

      [tri1, tri2].forEach(tri => {
        // normal da face (segura)
        let n = computeFaceNormalSafe(tri[0], tri[1], tri[2]);

        // garantir que a normal aponte para fora da esfera:
        // testamos o sinal do produto escalar entre normal da face e vetor radial (tri[0]).
        const centerDir = tri[0];
        const dot = n[0]*centerDir[0] + n[1]*centerDir[1] + n[2]*centerDir[2];
        if (dot < 0) {
          n = [-n[0], -n[1], -n[2]];
        }

        // empurrar os 3 vértices da face, cada um com a mesma normal (flat shading)
        tri.forEach(v => {
          positions.push(v[0], v[1], v[2]);
          normals.push(n[0], n[1], n[2]);
          indices.push(index++);
        });
      });
    }
  }

  return { positions, normals, indices };
}

// normal segura: evita divisão por zero e normaliza
function computeFaceNormalSafe(v1, v2, v3) {
  const Ux = v2[0] - v1[0], Uy = v2[1] - v1[1], Uz = v2[2] - v1[2];
  const Vx = v3[0] - v1[0], Vy = v3[1] - v1[1], Vz = v3[2] - v1[2];

  // cross U x V
  let Nx = Uy * Vz - Uz * Vy;
  let Ny = Uz * Vx - Ux * Vz;
  let Nz = Ux * Vy - Uy * Vx;

  let len = Math.hypot(Nx, Ny, Nz);
  if (len < 1e-6) {
    // triângulo degenerado: fallback para normal aproximada = posição normalizada do vértice v1
    const lv = Math.hypot(v1[0], v1[1], v1[2]) || 1.0;
    return [v1[0]/lv, v1[1]/lv, v1[2]/lv];
  }

  Nx /= len; Ny /= len; Nz /= len;
  return [Nx, Ny, Nz];
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

    let sphereData = null;

    const VertexBuffer = gl.createBuffer();
    let sphereVertices = [];

    const NormalBuffer = gl.createBuffer();
    let sphereNormals = [];

    const IndexBuffer = gl.createBuffer();
    let sphereIndices = [];

    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');

    const modelViewMatrixUniformLocation = gl.getUniformLocation(program,'u_modelViewMatrix');
    const viewingMatrixUniformLocation = gl.getUniformLocation(program,'u_viewingMatrix');
    const projectionMatrixUniformLocation = gl.getUniformLocation(program,'u_projectionMatrix');
    const inverseTransposeModelViewMatrixUniformLocation = gl.getUniformLocation(program, `u_inverseTransposeModelViewMatrix`);

    const lightPositionUniformLocation = gl.getUniformLocation(program,'u_lightPosition');
    const viewPositionUniformLocation = gl.getUniformLocation(program,'u_viewPosition');

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let modelViewMatrix = [];
    let inverseTransposeModelViewMatrix = [];

    let P0 = [0.0,0.0,2.0];
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
    let z_far = -20.0;

    let projectionMatrix = m4.setOrthographicProjectionMatrix(xw_min,xw_max,yw_min,yw_max,z_near,z_far);

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;
    let normalOp = 2;
    let n = 30;

    const n_slices_stacks = document.querySelector("#value_slices_stacks");
    const input_slices_stacks = document.querySelector("#n_slices_stacks");

    n_slices_stacks.textContent = input_slices_stacks.value; // initial value

    input_slices_stacks.addEventListener("input", () => {
        n_slices_stacks.textContent = input_slices_stacks.value;
        n = parseInt(input_slices_stacks.value);
        if (normalOp == 1)
            sphereData = createSphereSmooth(radius,n, n);
        else
            sphereData = createSphereFlat(radius,n, n);
        sphereVertices = new Float32Array(sphereData.positions);
        sphereNormals = new Float32Array(sphereData.normals);
        sphereIndices = new Uint16Array(sphereData.indices);

        gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sphereVertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sphereNormals, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereIndices, gl.STATIC_DRAW);
    });



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
        case 's':
          normalOp = 1;
          sphereData = createSphereSmooth(radius,n,n);
          sphereVertices = new Float32Array(sphereData.positions);
          sphereNormals = new Float32Array(sphereData.normals);
          sphereIndices = new Uint16Array(sphereData.indices);
          gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, sphereVertices, gl.STATIC_DRAW);
          gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, sphereNormals, gl.STATIC_DRAW);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereIndices, gl.STATIC_DRAW);
          break;
        case 'f':
          normalOp = 2;
          sphereData = createSphereFlat(radius,n,n);
          sphereVertices = new Float32Array(sphereData.positions);
          sphereNormals = new Float32Array(sphereData.normals);
          sphereIndices = new Uint16Array(sphereData.indices);
          gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, sphereVertices, gl.STATIC_DRAW);
          gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, sphereNormals, gl.STATIC_DRAW);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereIndices, gl.STATIC_DRAW);
          break;
      }
    }

    let theta_x = 0.0;
    let theta_y = 0.0;
    let theta_z = 0.0;

    color = [1.0,0.0,0.0];

    let radius = 0.5;
    if (normalOp == 1)
        sphereData = createSphereSmooth(radius,30, 30);
    else
        sphereData = createSphereFlat(radius,30, 30);
    sphereVertices = new Float32Array(sphereData.positions);
    sphereNormals = new Float32Array(sphereData.normals);
    sphereIndices = new Uint16Array(sphereData.indices);

    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereVertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereNormals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereIndices, gl.STATIC_DRAW);

    function drawSphere(){
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

      gl.enableVertexAttribArray(normalLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
      
      modelViewMatrix = m4.identity();
      modelViewMatrix = m4.xRotate(modelViewMatrix,degToRad(theta_x));
      modelViewMatrix = m4.yRotate(modelViewMatrix,degToRad(theta_y));
      modelViewMatrix = m4.zRotate(modelViewMatrix,degToRad(theta_z));

      inverseTransposeModelViewMatrix = m4.transpose(m4.inverse(modelViewMatrix));

      gl.uniformMatrix4fv(modelViewMatrixUniformLocation,false,modelViewMatrix);
      gl.uniformMatrix4fv(inverseTransposeModelViewMatrixUniformLocation,false,inverseTransposeModelViewMatrix);
      gl.uniformMatrix4fv(viewingMatrixUniformLocation,false,viewingMatrix);
      gl.uniformMatrix4fv(projectionMatrixUniformLocation,false,projectionMatrix);

      gl.uniform3fv(colorUniformLocation, new Float32Array(color));
      gl.uniform3fv(viewPositionUniformLocation, new Float32Array(P0));
      gl.uniform3fv(lightPositionUniformLocation, new Float32Array([1.0,1.0,1.0]));

      gl.drawElements(gl.TRIANGLES, sphereIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (rotateX)
        theta_x += 1;
      if (rotateY)
        theta_y += 1;
      if (rotateZ)
        theta_z += 1;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      P0 = [0.0,0.0,2.0];
      Pref = [0.0,0.0,0.0];
      V = [0.0,1.0,0.0];
      viewingMatrix = m4.setViewingMatrix(P0,Pref,V);
      drawSphere();

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