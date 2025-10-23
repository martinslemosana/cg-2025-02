function main1() {
    const canvas = document.getElementById('glCanvas1');
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

    const colorUniformLocation = gl.getUniformLocation(program,'u_color');
    let color = [0.0,0.0,1.0];
    gl.uniform3fv(colorUniformLocation,color);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const VertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, setSquareVertices(-0.5,-0.5,1,1), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let xw_min = -1.0;
    let xw_max = 1.0;
    let yw_min = -1.0;
    let yw_max = 1.0;
    let xw_offset = 0.01;

    function drawScene(){
      gl.clear(gl.COLOR_BUFFER_BIT);

      if(xw_min>1 || xw_min<-3)
        xw_offset=-xw_offset;
      xw_min+=xw_offset;
      xw_max+=xw_offset;

      let viewingMatrix = m3.setClippingWindow(xw_min,yw_min,xw_max,yw_max);
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

window.addEventListener('load', main1);