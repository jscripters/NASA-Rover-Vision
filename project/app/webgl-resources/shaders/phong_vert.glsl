#version 300 es
precision mediump float;

uniform int uTotalLightSources;

in vec3 aPosition;
in vec3 aNormal;

out vec3 vN;
out vec3 vL[uTotalLightSources];
out vec3 vE;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 lightPositions[uTotalLightSources];

void main()
{
  vec3 pos = (modelViewMatrix * vec4(aPosition, 1.0)).xyz;

  for (int i = 0; i < uTotalLightSources; ++i) {
    vL[i] = normalize(lightPositions[i] - pos);
  }

  vE = normalize( -pos );
  vN = normalize( (modelViewMatrix*vec4(aNormal, 0.0)).xyz);
  gl_Position = projectionMatrix * vec4(pos, 1.0);
}
