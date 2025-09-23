// Vertex shader source code
const vertexShaderSource = `
  attribute vec2 a_position;
  uniform vec2 u_translation;

  void main() {
    vec2 position;
    position = a_position + u_translation;
    gl_Position = vec4(position, 0, 1);
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

function createShader1(gl, type, source) {
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

function createProgram1(gl, vertexShader, fragmentShader) {
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


function main(){
  const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }
    
    // Create shaders
    const vertexShader = createShader1(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader1(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    // Create program
    const program = createProgram1(gl, vertexShader, fragmentShader);
    
    gl.useProgram(program);

    // Define triangle vertices (in clip space coordinates)
    const vertices = new Float32Array([
         0.0,  0.25,
        -0.25, -0.25,
         0.25, -0.25
    ]);

    // Create buffer and bind vertex data
    const VertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    // Get attribute location
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    // Enable and set up the position attribute
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    let translationVector = [0.0,0.0];

    const translationUniformLocation = gl.getUniformLocation(program, 'u_translation');
    gl.uniform2fv(translationUniformLocation,translationVector);

    let colorVector = [1.0,0.0,0.0];

    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    gl.uniform3fv(colorUniformLocation,colorVector);

    canvas.addEventListener("mousedown",mouseClick,false);
  
    function mouseClick(event){
      console.log(event.offsetX,event.offsetY);
    }
  
    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown",keyDown,false);
  
    function keyDown(event){
      event.preventDefault();
      switch(event.key){
        case 'ArrowUp':
          translationVector[1] += 0.1;
          break;
        case 'ArrowDown':
          translationVector[1] -= 0.1;
          break;
          case 'ArrowRight':
            translationVector[0] += 0.1;
            break;
          case 'ArrowLeft':
            translationVector[0] -= 0.1;
            break;
        case 'c':
          colorVector = [Math.random(),Math.random(),Math.random()];
          break;
      }
      gl.uniform3fv(colorUniformLocation,colorVector);
      gl.uniform2fv(translationUniformLocation,translationVector);
      drawScene();
    }

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawScene();
}

main();