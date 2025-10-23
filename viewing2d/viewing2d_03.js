function main3() {
  const canvas = document.getElementById('glCanvas3');
  const gl = canvas.getContext('webgl');

  if (!gl) {
      console.error('WebGL not supported');
      return;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const modelMatrixUniformLocation = gl.getUniformLocation(program,'u_modelMatrix');
  let modelMatrix = m3.identity();
  gl.uniformMatrix3fv(modelMatrixUniformLocation,false,modelMatrix);

  const viewingMatrixUniformLocation = gl.getUniformLocation(program,'u_viewingMatrix');
  let viewingMatrix = m3.setClippingWindow(-1,-1,1,1);
  gl.uniformMatrix3fv(viewingMatrixUniformLocation,false,viewingMatrix);

  const colorUniformLocation = gl.getUniformLocation(program,'u_color');
  let color = [1.0,0.0,0.0];
  gl.uniform3fv(colorUniformLocation,color);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const VertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, setSquareVertices(-0.5,-0.5,1,1), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  let w = 1.0
  let offset = 0.01;

  function drawScene(){
    gl.clear(gl.COLOR_BUFFER_BIT);

    if(w>3 || w<0.5)
      offset=-offset;
    w+=offset;

    let viewingMatrix = m3.setClippingWindow(-w,-w,w,w);
    gl.uniformMatrix3fv(viewingMatrixUniformLocation,false,viewingMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

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

window.addEventListener('load', main3);