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
    let numSides = 30;
    let radius = 0.05;
    let ballVertices = setCircleVertices(numSides,radius);
    let centerBarVertices = new Float32Array([
        0.0,1.0,
        0.0,-1.0
    ]);
    
    const matrixUniformLocation = gl.getUniformLocation(program,'u_matrix');
    let matrix = m3.identity();
    gl.uniformMatrix3fv(matrixUniformLocation,false,matrix);

    const colorUniformLocation = gl.getUniformLocation(program,'u_color');
    let color = [0.0,0.0,1.0];
    gl.uniform3fv(colorUniformLocation,color);
    
    let ty_left = 0.0;
    let ty_right = 0.0;
    let ty_ball = 0.0;
    let tx_ball = 0.0;
    let tx_ball_step = 0.005;
    let ty_ball_step = 0.005;

    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown",keyDown,false);
  
    function keyDown(event){
      event.preventDefault();
      switch(event.key){
        case 'ArrowUp':
          ty_right += 0.05;
          break;
        case 'ArrowDown':
          ty_right -= 0.05;
          break;
        case 'w':
          ty_left += 0.05;
          break;
        case 's':
          ty_left -= 0.05;
          break;
      }
    }

    let pontosLeft = 0;
    let pontosRight = 0;

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      tx_ball += tx_ball_step;
      ty_ball += ty_ball_step;

      if(ty_ball > 0.95 || ty_ball < -0.95)
        ty_ball_step = -ty_ball_step;

      if(tx_ball > 0.8)
        if(ty_ball >= ty_right-0.2 && ty_ball <= ty_right+0.2)
            tx_ball_step = -tx_ball_step;
        else{
            tx_ball = 0.0;
            ty_ball = 0.0;
            pontosRight++;
            document.getElementById("placar").textContent = pontosRight + " x " + pontosLeft;
        }
    
      if(tx_ball < -0.8)
        if(ty_ball >= ty_left-0.2 && ty_ball <= ty_left+0.2)
            tx_ball_step = -tx_ball_step;
        else{
            tx_ball = 0.0;
            ty_ball = 0.0;
            pontosLeft++;
            document.getElementById("placar").textContent = pontosRight + " x " + pontosLeft;
        }

      color = [0.0,0.0,1.0];
      gl.uniform3fv(colorUniformLocation,color);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, paddleVertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      matrix = m3.identity();
      matrix = m3.translate(matrix,0.9,0.0);
      matrix = m3.translate(matrix,0.0,ty_right);
      gl.uniformMatrix3fv(matrixUniformLocation,false,matrix);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      color = [0.0,0.0,1.0];
      gl.uniform3fv(colorUniformLocation,color);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, paddleVertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      matrix = m3.identity();
      matrix = m3.translate(matrix,-0.9,0.0);
      matrix = m3.translate(matrix,0.0,ty_left);
      gl.uniformMatrix3fv(matrixUniformLocation,false,matrix);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      color = [1.0,0.0,0.0];
      gl.uniform3fv(colorUniformLocation,color);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, ballVertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      matrix = m3.identity();
      matrix = m3.translate(matrix,tx_ball,ty_ball);
      gl.uniformMatrix3fv(matrixUniformLocation,false,matrix);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, numSides+2);

      color = [0.0,0.0,0.0];
      gl.uniform3fv(colorUniformLocation,color);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, centerBarVertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      matrix = m3.identity();
      gl.uniformMatrix3fv(matrixUniformLocation,false,matrix);
      gl.drawArrays(gl.LINES, 0, 2);

      requestAnimationFrame(drawScene);
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