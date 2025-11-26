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
        vec3 ambient  = 0.6 * baseColor;
        vec3 diffuseC = 0.4 * diffuse * baseColor;
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
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let modelViewMatrix = [];
    let inverseTransposeModelViewMatrix = [];

    let P0 = [0.0,0.0,10.0];
    let Pref = [0.0,0.0,0.0];
    let V = [0.0,1.0,0.0];
    let viewingMatrix = m4.setViewingMatrix(P0,Pref,V);
    
    gl.uniform3fv(viewPositionUniformLocation, new Float32Array(P0));
    gl.uniform3fv(lightPositionUniformLocation, new Float32Array([0.0,0.0,30.0]));

    let xw_min = -8.0;
    let xw_max = 8.0;
    let yw_min = -4.0;
    let yw_max = 4.0;
    let z_near = -1.0;
    let z_far = -50.0;

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
    const textureFiles = [ 
        "jupiter.jpg",
        "sun.jpg", 
        "mercury.jpg",
        "earth.jpg",
        "moon.jpg"
    ];
    
    function loadTexture(url) { 
        const texture = gl.createTexture(); 
        gl.bindTexture(gl.TEXTURE_2D, texture); // Temporary pixel while the image loads 
        const tempPixel = new Uint8Array([255, 255, 255, 255]); 
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, tempPixel ); 
        const image = new Image(); 
        image.src = url; 
        image.onload = () => { 
            gl.bindTexture(gl.TEXTURE_2D, texture); 
            gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image ); 
            // NPOT-safe settings (works with any image size) 
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); 
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); 
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); 
        }; 
        return texture; 
    } 
    
    let textures = []; // will hold WebGLTexture objects 
    textureFiles.forEach((file, i) => { 
        textures[i] = loadTexture(file); 
        textures[i].loaded = true; 
    });

    const spheres = [ 
        { texture: 0, x: -5, y: 0, z: -5, speed: 0.005, scale: 2.0 }, // Jupiter 
        { texture: 1, x: 0, y: 0, z: 0, speed: 0.005, scale: 4.0 }, // Sun 
        { texture: 2, x: 4, y: 0, z: -4, speed: 0.005, scale: 2.0 }, // Mercury
        { texture: 3, x: -3, y: 0, z: 3, speed: 0.005, scale: 1.0 }, // Earth
        { texture: 4, x: 1, y: 0, z: 0, speed: 0.005, scale: 0.3 }  // Moon
    ]; 

    function drawSphere(texture, modelMatrix) {
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);

      gl.enableVertexAttribArray(normalLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);

      gl.enableVertexAttribArray(texcoordLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
      
      modelViewMatrix = modelMatrix;

      inverseTransposeModelViewMatrix = m4.transpose(m4.inverse(modelViewMatrix));

      gl.uniformMatrix4fv(modelViewMatrixUniformLocation,false,modelViewMatrix);
      gl.uniformMatrix4fv(inverseTransposeModelViewMatrixUniformLocation,false,inverseTransposeModelViewMatrix);
      gl.uniformMatrix4fv(viewingMatrixUniformLocation,false,viewingMatrix);
      gl.uniformMatrix4fv(projectionMatrixUniformLocation,false,projectionMatrix);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);
      
      gl.drawElements(gl.TRIANGLES, sphereIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    let time = 0.0;

    function drawScene() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        time += 1;
        for (let i = 0; i < spheres.length-2; i++) {
            const s = spheres[i];
            // Position the sphere
            let modelMatrix = m4.identity();
            modelMatrix = m4.scale(modelMatrix, s.scale, s.scale, s.scale);
            modelMatrix = m4.translate(modelMatrix, s.x, s.y, s.z);
            // Add rotation
            modelMatrix = m4.yRotate(modelMatrix, time * s.speed);
            // Draw using the correct texture
            if (textures[s.texture].loaded) {
                drawSphere(textures[s.texture], modelMatrix);
            }
        }
        let s = spheres[3]; // Earth
        let modelMatrix = m4.identity();
        modelMatrix = m4.scale(modelMatrix, s.scale, s.scale, s.scale);
        modelMatrix = m4.translate(modelMatrix, s.x, s.y, s.z);
        modelMatrix = m4.yRotate(modelMatrix, time * s.speed);
        if (textures[s.texture].loaded) {
            drawSphere(textures[s.texture], modelMatrix);
        }
        let moon = spheres[4];
        let moonModelMatrix = m4.identity();
        moonModelMatrix = m4.scale(moonModelMatrix, moon.scale, moon.scale, moon.scale);
        moonModelMatrix = m4.yRotate(moonModelMatrix, time * moon.speed * 2);
        moonModelMatrix = m4.translate(moonModelMatrix, moon.x, moon.y, moon.z);
        moonModelMatrix = m4.yRotate(moonModelMatrix, time * moon.speed * 2);
        moonModelMatrix = m4.translate(moonModelMatrix, s.x, s.y, s.z); // Position relative to Earth
        moonModelMatrix = m4.yRotate(moonModelMatrix, time * s.speed);
        if (textures[moon.texture].loaded) {
            drawSphere(textures[moon.texture], moonModelMatrix);
        }
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