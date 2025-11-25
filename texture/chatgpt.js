<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Textured Earth</title>
<style>
  body { margin: 0; background: black; }
  canvas { width: 100vw; height: 100vh; display: block; }
</style>
</head>
<body>

<canvas id="glcanvas"></canvas>

<script src="m4.js"></script>
<script>
//
// ---------- SHADERS -----------------------------------------------------
//
const vertexShaderSource = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

varying vec2 v_texcoord;

void main() {
    gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
    v_texcoord = a_texcoord;
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec2 v_texcoord;
uniform sampler2D u_texture;

void main() {
    gl_FragColor = texture2D(u_texture, v_texcoord);
}
`;

//
// ---------- SPHERE GENERATION -------------------------------------------
//
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
            texcoords.push(lon / longBands, 1 - lat / latBands);
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

//
// ---------- WEBGL INITIALIZATION ----------------------------------------
//
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    return program;
}

//
// ---------- MAIN ---------------------------------------------------------
//
window.onload = () => {
    const canvas = document.getElementById("glcanvas");
    const gl = canvas.getContext("webgl");

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    // Attributes
    const a_position = gl.getAttribLocation(program, "a_position");
    const a_normal = gl.getAttribLocation(program, "a_normal");
    const a_texcoord = gl.getAttribLocation(program, "a_texcoord");

    // Uniforms
    const u_modelViewMatrix = gl.getUniformLocation(program, "u_modelViewMatrix");
    const u_projectionMatrix = gl.getUniformLocation(program, "u_projectionMatrix");

    // Sphere data
    const sphere = createSphere();

    function makeBuffer(data, target = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, new Float32Array(data), usage);
        return buffer;
    }

    const posBuffer = makeBuffer(sphere.positions);
    const normalBuffer = makeBuffer(sphere.normals);
    const texBuffer = makeBuffer(sphere.texcoords);
    const indexBuffer = makeBuffer(sphere.indices, gl.ELEMENT_ARRAY_BUFFER);

    // Texture
    const texture = gl.createTexture();
    const image = new Image();
    image.src = "earth.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Allow non-power-of-two textures correctly (NO MIPMAPS)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        drawScene();
    };

    function drawScene() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        // MATRICES -----------------------
        let modelView = m4.identity();
        modelView = m4.translate(modelView, 0, 0, -3);
        modelView = m4.yRotate(modelView, Date.now() * 0.0003);

        const aspect = canvas.width / canvas.height;
        const projection = m4.setPerspectiveProjectionMatrix(
            -aspect, aspect, -1, 1, 1, 200
        );

        gl.uniformMatrix4fv(u_modelViewMatrix, false, new Float32Array(modelView));
        gl.uniformMatrix4fv(u_projectionMatrix, false, new Float32Array(projection));

        // POSITION
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_position);

        // NORMAL
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_normal);

        // TEXCOORD
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texcoord);

        // INDICES
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(drawScene);
    }
};
</script>
</body>
</html>
