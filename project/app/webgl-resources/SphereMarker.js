class CircleMarker {
  constructor(gl, name, radius = 0.1, latSegments = 16, longSegments = 16, color = [0, 0, 1, 1], divContainerElement) {
    this.gl = gl;
    this.name = name;
    this.radius = radius;
    this.latSegments = latSegments;
    this.longSegments = longSegments;
    this.color = color;

    this.setupContainerElement(name);
    this.textVisible = false;

    this.vertexBuffer = null;
    this.colorBuffer = null;
    this.indexBuffer = null;

    this.vertexCount = 0;
    this.shaderProgram = initShaders(gl, './shaders/vert.glsl', './shaders/frag.glsl');
    this.initBuffers();
  }

  setupContainerElement(name) {
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.pointerEvents = 'none';
    this.div.style.color = 'white';
    this.textNode = document.createTextNode(name);
    this.div.appendChild(this.textNode);

    divContainerElement.appendChild(this.div);
  }

  initBuffers() {
    const vertices = [];
    const colors = [];
    const indices = [];

    for (let lat = 0; lat <= this.latSegments; lat++) {
      const theta = lat * Math.PI / this.latSegments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= this.longSegments; lon++) {
        const phi = lon * 2 * Math.PI / this.longSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = this.radius * cosPhi * sinTheta;
        const y = this.radius * cosTheta;
        const z = this.radius * sinPhi * sinTheta;

        vertices.push(x, y, z);
        colors.push(...this.color);
      }
    }

    for (let lat = 0; lat < this.latSegments; lat++) {
      for (let lon = 0; lon < this.longSegments; lon++) {
        const first = (lat * (this.longSegments + 1)) + lon;
        const second = first + this.longSegments + 1;

        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    const gl = this.gl;
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    this.vertexCount = indices.length;
  }

  draw(modelViewMatrix, projectionMatrix) {
    const gl = this.gl;
    gl.useProgram(this.shaderProgram);

    console.log(modelViewMatrix, projectionMatrix);

    const aVertexPosition = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexPosition);

    const aVertexColor = gl.getAttribLocation(this.shaderProgram, "aVertexColor");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.vertexAttribPointer(aVertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aVertexColor);

    const uMVPMatrix = gl.getUniformLocation(this.shaderProgram, "uMVPMatrix");
    gl.uniformMatrix4fv(uMVPMatrix, false, flatten(mult(projectionMatrix, modelViewMatrix)));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);

    if (this.textVisible) {
      this.renderText(modelViewMatrix, projectionMatrix);
    }
  }

  renderText(modelViewMatrix, projectionMatrix) {
    let point = vec4(this.radius, 0, 0, 1);

    let clipspace = mult(projectionMatrix, mult(modelViewMatrix, point));
    clipspace[0] /= clipspace[3];
    clipspace[1] /= clipspace[3];

    let pixelX = (clipspace[0] *  0.5 + 0.5) * gl.canvas.width;
    let pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

    this.div.style.left = Math.floor(pixelX) + "px";
    this.div.style.top  = Math.floor(pixelY) + "px";
    this.textNode.nodeValue = this.name;
  }
}
