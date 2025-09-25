// Vertex shader source code
const vertexShaderSource = `
    attribute vec2 a_position;
    uniform mat3 u_matrix;

    void main() {
        gl_Position = vec4((u_matrix * vec3(a_position,1.0)).xy, 0.0, 1.0);
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

function setCircleVertices(numSides,radius) {
  const vertices = [];

  // Center point of the pentagon
  vertices.push(0.0, 0.0);

  for (let i = 0; i <= numSides; i++) {
      const angle = i * 2 * Math.PI / numSides;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      vertices.push(x, y);
  }

  return new Float32Array(vertices);
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

    const VertexBuffer = gl.createBuffer();
    let paddleVertices = setSquareVertices(-0.05,-0.2,0.1,0.4);
    let ballVertices = setCircleVertices(30,0.1);
    
    const matrixUniformLocation = gl.getUniformLocation(program,'u_matrix');
    let matrix = m3.identity();
    gl.uniformMatrix3fv(matrixUniformLocation,false,matrix);

    const colorUniformLocation = gl.getUniformLocation(program,'u_color');
    let color = [0.0,0.0,1.0];
    gl.uniform3fv(colorUniformLocation,color);
    
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, paddleVertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      matrix = m3.translate(matrix,0.9,0.0);
      gl.uniformMatrix3fv(matrixUniformLocation,false,matrix);
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