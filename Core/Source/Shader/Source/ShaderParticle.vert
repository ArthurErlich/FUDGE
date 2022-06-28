#version 300 es
/**
* TODO: write this
* @authors 2021, Luis Keck, HFU, 2021 | Jirka Dell'Oro-Friedl, HFU, 2021 | Jonas Plotzky, HFU, 2022
*/

uniform mat4 u_mtxMeshToView;
in vec3 a_vctPosition;

uniform mat3 u_mtxPivot;
in vec2 a_vctTexture;
out vec2 v_vctTexture;

out vec4 v_vctColor;

uniform float u_fNumberOfParticles;
uniform float u_fTime;
uniform sampler2D u_fRandomNumbers;

void main() {
  vec4 vctPosition = vec4(a_vctPosition, 1.0);
  mat4 mtxMeshToView = u_mtxMeshToView;
  float particleIndex = float(gl_InstanceID);
  // float a = texture(u_fRandomNumbers, vec2(particleIndex, 10.0)).r;

  /*$selfDefinedVariables*/
  /*$localTransformationMatrices*/

  // calculate position and normal according to input and defines
  gl_Position = mtxMeshToView * /*$localTransformations*/vctPosition;
  v_vctTexture = vec2(u_mtxPivot * vec3(a_vctTexture, 1.0)).xy;

  // always full opacity for now...
  v_vctColor.a = 1.0;
}