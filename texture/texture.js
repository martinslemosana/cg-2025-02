// Vertex shader source code
const vertexShaderSource = `
    attribute vec3 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_texcoord;
    
    varying vec3 v_normal;
    varying vec2 v_texcoord;
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
        v_texcoord = a_texcoord;
        v_surfaceToLight = u_lightPosition - surfacePosition;
        v_surfaceToView = u_viewPosition - surfacePosition;
    }
`;

// Fragment shader source code
const fragmentShaderSource = `
    precision mediump float;

    varying vec3 v_normal;
    varying vec2 v_texcoord;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    uniform sampler2D u_texture;

    void main() {
        // Sample texture only once
        vec4 tex = texture2D(u_texture, v_texcoord);
        vec3 baseColor = tex.rgb;

        // Normalize vectors
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(v_surfaceToLight);
        vec3 viewDir  = normalize(v_surfaceToView);
        vec3 halfVec  = normalize(lightDir + viewDir);

        // Diffuse
        float diffuse = max(dot(lightDir, normal), 0.0);

        // Specular
        float specular = 0.0;
        if (diffuse > 0.0) {
            specular = pow(max(dot(normal, halfVec), 0.0), 250.0);
        }

        // Final color
        vec3 ambient  = 0.5 * baseColor;
        vec3 diffuseC = 0.5 * diffuse * baseColor;
        vec3 specularC = specular * vec3(1.0);

        gl_FragColor = vec4(ambient + diffuseC + specularC, tex.a);
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

function createSphere(latBands = 40, longBands = 40, radius = 1) {
  const positions = [];
  const normals = [];
  const texcoords = [];
  const indices = [];

  for (let lat = 0; lat <= latBands; lat++) {
      const theta = lat * Math.PI / latBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= longBands; lon++) {
          const phi = lon * 2 * Math.PI / longBands;
          const sinPhi = Math.sin(phi);
          const cosPhi = Math.cos(phi);

          const x = cosPhi * sinTheta;
          const y = cosTheta;
          const z = sinPhi * sinTheta;

          positions.push(radius * x, radius * y, radius * z);
          normals.push(x, y, z);
          texcoords.push(lon / longBands, lat / latBands);
      }
  }

  for (let lat = 0; lat < latBands; lat++) {
      for (let lon = 0; lon < longBands; lon++) {
          const a = lat * (longBands + 1) + lon;
          const b = a + longBands + 1;

          indices.push(a, b, a + 1);
          indices.push(b, b + 1, a + 1);
      }
  }

  return { positions, normals, texcoords, indices };
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
    const texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

    let sphereData = null;

    const VertexBuffer = gl.createBuffer();
    let sphereVertices = [];

    const NormalBuffer = gl.createBuffer();
    let sphereNormals = [];

    const texcoordBuffer = gl.createBuffer();
    let sphereTexcoords = [];

    const IndexBuffer = gl.createBuffer();
    let sphereIndices = [];

    const modelViewMatrixUniformLocation = gl.getUniformLocation(program,'u_modelViewMatrix');
    const viewingMatrixUniformLocation = gl.getUniformLocation(program,'u_viewingMatrix');
    const projectionMatrixUniformLocation = gl.getUniformLocation(program,'u_projectionMatrix');
    const inverseTransposeModelViewMatrixUniformLocation = gl.getUniformLocation(program, `u_inverseTransposeModelViewMatrix`);

    const lightPositionUniformLocation = gl.getUniformLocation(program,'u_lightPosition');
    const viewPositionUniformLocation = gl.getUniformLocation(program,'u_viewPosition');

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let modelViewMatrix = [];
    let inverseTransposeModelViewMatrix = [];

    let P0 = [0.0,0.0,4.0];
    let Pref = [0.0,0.0,0.0];
    let V = [0.0,1.0,0.0];
    let viewingMatrix = m4.setViewingMatrix(P0,Pref,V);
    
    gl.uniform3fv(viewPositionUniformLocation, new Float32Array(P0));
    gl.uniform3fv(lightPositionUniformLocation, new Float32Array([2.0,2.0,2.0]));

    let xw_min = -1.0;
    let xw_max = 1.0;
    let yw_min = -1.0;
    let yw_max = 1.0;
    let z_near = -1.0;
    let z_far = -20.0;

    let projectionMatrix = m4.setOrthographicProjectionMatrix(xw_min,xw_max,yw_min,yw_max,z_near,z_far);

    let n = 30;

    let radius = 0.5;
    sphereData = createSphere(n, n, radius);
    sphereVertices = new Float32Array(sphereData.positions);
    sphereNormals = new Float32Array(sphereData.normals);
    sphereIndices = new Uint16Array(sphereData.indices);
    sphereTexcoords = new Float32Array(sphereData.texcoords);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(normalLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereNormals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(texcoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereTexcoords, gl.STATIC_DRAW);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereIndices, gl.STATIC_DRAW);

    // Texture
    const texture = gl.createTexture();
    const image = new Image();
    image.src = "earth.jpeg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Allow non-power-of-two textures correctly (NO MIPMAPS)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const texLocation = gl.getUniformLocation(program, "u_texture");

        gl.uniform1i(texLocation, 0); // use TEXTURE0

        drawScene();
    };

    let angle = 0.0;

    function drawSphere(){
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);

      gl.enableVertexAttribArray(normalLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);

      gl.enableVertexAttribArray(texcoordLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
      
      modelViewMatrix = m4.identity();
      modelViewMatrix = m4.yRotation(degToRad(angle));

      inverseTransposeModelViewMatrix = m4.transpose(m4.inverse(modelViewMatrix));

      gl.uniformMatrix4fv(modelViewMatrixUniformLocation,false,modelViewMatrix);
      gl.uniformMatrix4fv(inverseTransposeModelViewMatrixUniformLocation,false,inverseTransposeModelViewMatrix);
      gl.uniformMatrix4fv(viewingMatrixUniformLocation,false,viewingMatrix);
      gl.uniformMatrix4fv(projectionMatrixUniformLocation,false,projectionMatrix);

      gl.uniform3fv(viewPositionUniformLocation, new Float32Array(P0));
      gl.uniform3fv(lightPositionUniformLocation, new Float32Array([1.0,1.0,1.0]));

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);
      
      gl.drawElements(gl.TRIANGLES, sphereIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      angle += 1;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
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