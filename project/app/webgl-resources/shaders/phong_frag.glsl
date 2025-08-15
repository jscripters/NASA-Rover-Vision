#version 300 es
precision mediump float;

uniform int uTotalLightSources;
uniform vec4 ambientProducts[uTotalLightSources];
uniform vec4 diffuseProducts[uTotalLightSources];
uniform vec4 specularProducts[uTotalLightSources];
uniform float shininess;

in vec3 vN;
in vec3 vL[uTotalLightSources];
in vec3 vE;

out vec4 fColor;

void main()
{
  vec3 N = normalize(vN);
  vec3 E = normalize(vE);

  vec3 color = vec3(0.0);

  for (int i = 0; i < uTotalLightSources; ++i) {
    vec3 L = normalize(vL[i]);
    vec3 H = normalize( L + E );
    vec3 ambient = ambientProducts[i].rgb;
    float diffuseTerm = max( dot(L, N), 0.0 );
    vec3 diffuse = diffuseTerm*diffuseProducts[i].rgb;
    float specularTerm = pow( max(dot(N, H), 0.0), shininess );
    vec3 specular = specularTerm * specularProducts[i].rgb;
    if ( dot(L, N) < 0.0 ) specular = vec3(0.0, 0.0, 0.0);
    color += ambient + diffuse + specular;
  }

  fColor = vec4(min(color, 1.0), 1.0);
}
