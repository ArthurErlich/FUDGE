#version 300 es
struct LightAmbient {
  vec4 color;
};
struct LightDirectional {
  vec4 color;
  vec3 direction;
};

const uint MAX_LIGHTS_DIRECTIONAL = 100u;

in vec3 a_position;
in vec3 a_normal;
in vec2 a_textureUVs;
uniform mat4 u_world;
uniform mat4 u_projection;
uniform mat3 u_pivot;

uniform LightAmbient u_ambient;
uniform uint u_nLightsDirectional;
uniform LightDirectional u_directional[MAX_LIGHTS_DIRECTIONAL];
flat out vec4 v_color;
out vec2 v_textureUVs;

void main() {
  gl_Position = u_projection * vec4(a_position, 1.0);
  vec3 normal = normalize(transpose(inverse(mat3(u_world))) * a_normal);

  v_color = u_ambient.color;
  for(uint i = 0u; i < u_nLightsDirectional; i++) {
    float illumination = -dot(normal, u_directional[i].direction);
    if(illumination > 0.0f)
      v_color += illumination * u_directional[i].color; // vec4(1,1,1,1); // 
  }

  v_color.a = 1.0;
  v_textureUVs = vec2(u_pivot * vec3(a_textureUVs, 1.0)).xy;
}
