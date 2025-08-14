#version 300 es
precision mediump float;

const int NUM_LIGHTS = 2;

in vec3 aPosition;
in vec3 aNormal;

out vec3 vN;
out vec3 vL[NUM_LIGHTS];
out vec3 vE;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 lightPositions[NUM_LIGHTS];

void main()
{
  vec3 pos = (modelViewMatrix * vec4(aPosition, 1.0)).xyz;

  for (int i = 0; i < NUM_LIGHTS; ++i) {
    vL[i] = normalize(lightPositions[i] - pos);
  }

  vE = normalize( -pos );
  vN = normalize( (modelViewMatrix*vec4(aNormal, 0.0)).xyz);
  gl_Position = projectionMatrix * vec4(pos, 1.0);
}
