namespace FudgeCore {
  interface CodeStructure {
    variables?: CodeMutator;
    mtxLocal?: CodeTransformation[];
    mtxWorld?: CodeTransformation[];
    color?: CodeMutator;
  }

  interface CodeTransformation { 
    transformation: "translate" | "rotate" | "scale";
    mutator: CodeMutator; 
  }

  interface CodeMutator { [key: string]: string; }

  export class RenderInjectorParticleEffect extends RenderInjectorShader {
    public static readonly RANDOM_NUMBERS_TEXTURE_MAX_WIDTH: number = 1000;
    private static readonly FUNCTIONS: { [key: string]: Function } = {
      "addition": (_parameters: string[]) => {
        return `(${_parameters.reduce((_accumulator: string, _value: string) => `${_accumulator} + ${_value}`)})`;
      },
      "subtraction": (_parameters: string[]) => {
        return `(${_parameters.reduce((_accumulator: string, _value: string) => `${_accumulator} - ${_value}`)})`;
      },
      "multiplication": (_parameters: string[]) => {
        return `(${_parameters.reduce((_accumulator: string, _value: string) => `${_accumulator} * ${_value}`)})`;
      },
      "division": (_parameters: string[]) => {
        return `(${_parameters.reduce((_accumulator: string, _value: string) => `${_accumulator} / ${_value}`)})`;
      },
      "modulo": (_parameters: string[]) => {
        return `(${_parameters.reduce((_accumulator: string, _value: string) => `mod(${_accumulator}, ${_value})`)})`;
      },
      "linear": (_parameters: string[]) => {
        let x: string = _parameters[0];
        let xStart: string = _parameters[1];
        let yStart: string = _parameters[2];
        let xEnd: string = _parameters[3];
        let yEnd: string = _parameters[4];
        return `(${yStart} + (${x} - ${xStart}) * (${yEnd} - ${yStart}) / (${xEnd} - ${xStart}))`;
      },
      "polynomial": (_parameters: string[]) => {
        let x: string = _parameters[0];
        let a: string = _parameters[1];
        let b: string = _parameters[2];
        let c: string = _parameters[3];
        let d: string = _parameters[4];
        return `(${a} * pow(${x}, 3.0) + ${b} * pow(${x}, 2.0) + ${c} * ${x} + ${d})`;
      },
      "squareRoot": (_parameters: string[]) => {
        let x: string = _parameters[0];
        return `sqrt(${x})`;
      },
      "random": (_parameters: string[]) => {
        const maxWidth: string = RenderInjectorParticleEffect.RANDOM_NUMBERS_TEXTURE_MAX_WIDTH.toString() + ".0";
        return `texelFetch(u_fRandomNumbers, ivec2(mod(${_parameters[0]}, ${maxWidth}), ${_parameters[0]} / ${maxWidth}), 0).r`;
      },
      "randomRange": (_parameters: string[]) => {
        return `${RenderInjectorParticleEffect.FUNCTIONS["random"](_parameters)} * (${_parameters[2]} - ${_parameters[1]}) + ${_parameters[1]}`;
      }
    };
    private static readonly PREDEFINED_VARIABLES: { [key: string]: string } = {
      index: "fParticleIndex",
      numberOfParticles: "u_fNumberOfParticles",
      time: "u_fTime"
    };

    public static override decorate(_constructor: Function): void {
      Object.defineProperty(_constructor.prototype, "useProgram", {
        value: RenderInjectorShader.useProgram
      });
      Object.defineProperty(_constructor.prototype, "deleteProgram", {
        value: RenderInjectorShader.deleteProgram
      });
      Object.defineProperty(_constructor.prototype, "createProgram", {
        value: RenderInjectorShader.createProgram
      });
      Object.defineProperty(_constructor.prototype, "getVertexShaderSource", {
        value: RenderInjectorParticleEffect.getVertexShaderSource
      });
      Object.defineProperty(_constructor.prototype, "getFragmentShaderSource", {
        value: RenderInjectorParticleEffect.getFragmentShaderSource
      });
    }

    public static getVertexShaderSource(this: ParticleEffect): string {
      let codeStructure: CodeStructure = RenderInjectorParticleEffect.parseData(this.data, RenderInjectorParticleEffect.createVariableMap(this.data));
      let mtxLocal: CodeTransformation[] = codeStructure.mtxLocal;
      let mtxWorld: CodeTransformation[] = codeStructure.mtxWorld;

      let source: string = ShaderParticle.getVertexShaderSource()
        .replace("/*$variables*/", RenderInjectorParticleEffect.generateVariables(codeStructure.variables))
        .replace("/*$mtxLocal*/", RenderInjectorParticleEffect.generateTransformations(mtxLocal, true))
        .replace("/*$mtxLocal*/", mtxLocal && mtxLocal.length > 0 ? "* mtxLocal" : "")
        .replace("/*$mtxWorld*/", RenderInjectorParticleEffect.generateTransformations(mtxWorld, false))
        .replace("/*$mtxWorld*/", mtxWorld && mtxWorld.length > 0 ? "mtxWorld *" : "")
        .replace("/*$color*/", RenderInjectorParticleEffect.generateColor(codeStructure.color));
      return source; 
    }

    public static getFragmentShaderSource(this: ParticleEffect): string {
      return ShaderParticle.getFragmentShaderSource();
    }

    
    //#region code generation
    private static createVariableMap(_data: Serialization): {[key: string]: string} {
      let variableMap: {[key: string]: string} = {};
      Object.keys(_data.variables).forEach( (_variableName, _index) => {
        if (RenderInjectorParticleEffect.PREDEFINED_VARIABLES[_variableName])
          throw `Error in ${ParticleEffect.name}: "${_variableName}" is a predefined variable and can not be redeclared`;
        else
          return variableMap[_variableName] = `fVariable${_index}`; 
      });
      return variableMap;
    } 

    private static parseData(_data: Serialization, _variableMap: {[key: string]: string}): CodeStructure {
      let codeStructure: CodeStructure = {};
      codeStructure.variables = RenderInjectorParticleEffect.parseMutator(_data?.variables, _variableMap);
      codeStructure.variables = RenderInjectorParticleEffect.renameVariables(codeStructure.variables, _variableMap);
      codeStructure.color = RenderInjectorParticleEffect.parseMutator(_data?.color, _variableMap);
      codeStructure.mtxLocal = RenderInjectorParticleEffect.parseTransformations(_data?.mtxLocal, _variableMap);
      codeStructure.mtxWorld = RenderInjectorParticleEffect.parseTransformations(_data?.mtxWorld, _variableMap);
      return codeStructure;
    }
    
    private static parseTransformations(_data: Serialization, _variableMap: {[key: string]: string}): CodeTransformation[] {
      let transformations: CodeTransformation[] = [];
      for (const key in _data) {
        let transformation: General = _data[key];
        if (ParticleEffect.isTransformationData(transformation)) {
          transformations.push({
            transformation: transformation.transformation,
            mutator: RenderInjectorParticleEffect.parseMutator(transformation.values, _variableMap)
          });
        }
      }
      return transformations;
    }

    private static parseMutator(_mutator: Serialization, _variableMap: {[key: string]: string}): CodeMutator {
      let mutator: CodeMutator = {};
      for (const key in _mutator) {
        mutator[key] = RenderInjectorParticleEffect.parseExpression(_mutator[key], _variableMap);
      }
      return mutator;
    }

    private static renameVariables(_variables: CodeMutator, _variableMap: {[key: string]: string}): CodeMutator {
      let variables: CodeMutator = {};
      for (const key in _variables) {
        variables[_variableMap[key]] = _variables[key];
      }
      return variables;
    }

    private static parseExpression(_expression: ExpressionData, _variableMap: {[key: string]: string}): string {
      if (ParticleEffect.isFunctionData(_expression)) {
        let parameters: string[] = [];
        for (let param of _expression.parameters) {
          parameters.push(RenderInjectorParticleEffect.parseExpression(param, _variableMap));
        }
        return RenderInjectorParticleEffect.parseFunction(_expression.function, parameters);
      }
  
      if (ParticleEffect.isVariableData(_expression)) {
        let variableName: string = RenderInjectorParticleEffect.PREDEFINED_VARIABLES[_expression.value] || _variableMap[_expression.value];
        if (variableName)
          return variableName;
        else
          throw `Error in ${ParticleEffect.name}: "${_expression.value}" is not a defined variable`;
      } 
  
      if (ParticleEffect.isConstantData(_expression)) {
        let value: string = _expression.value.toString();
        return `${value}${value.includes(".") ? "" : ".0"}`;
      }
  
      throw `Error in ${ParticleEffect.name}: invalid node structure in particle effect serialization`;
    }
  
    private static parseFunction(_function: string, _parameters: string[]): string {
      if (_function in RenderInjectorParticleEffect.FUNCTIONS)
        return RenderInjectorParticleEffect.FUNCTIONS[_function](_parameters);
      else
        throw `Error in ${ParticleEffect.name}: "${_function}" is not an operation`;
    }

    private static generateVariables(_variables: CodeMutator): string {
      return Object.keys(_variables)
        .map( (_variableName) => `float ${_variableName} = ${_variables[_variableName]};`)
        .reduce( (_accumulator: string, _code: string) => `${_accumulator}\n${_code}`, "" ); 
    }

    private static generateTransformations(_transformations: CodeTransformation[], _isLocal: boolean): string {
      if (!_transformations || _transformations.length == 0) return "";

      let code: string = "";

      code += _transformations
        .map( (_transformation: CodeTransformation, _index: number) => {
          if (_transformation.transformation == "rotate") {
            let by: CodeMutator = _transformation.mutator;
            return `float fSinX${_index} = sin(${by.x ? by.x : "0.0"});
              float fCosX${_index} = cos(${by.x ? by.x : "0.0"});
              float fSinY${_index} = sin(${by.y ? by.y : "0.0"});
              float fCosY${_index} = cos(${by.y ? by.y : "0.0"});
              float fSinZ${_index} = sin(${by.z ? by.z : "0.0"});
              float fCosZ${_index} = cos(${by.z ? by.z : "0.0"});\n`;
          } else
            return "";
        })
        .filter( (_transformation: string) => _transformation != "")
        .reduce( (_accumulator: string, _code: string) => `${_accumulator}\n${_code}`, "" );
      code += "\n";
      
      code += `mat4 mtx${_isLocal ? "Local" : "World"} = `;
      code += _transformations
        .map( (_transformation: CodeTransformation, _index: number) => {
          let by: CodeMutator = _transformation.mutator;
          switch (_transformation.transformation) {
            case "translate":
              return `mat4(
              1.0, 0.0, 0.0, 0.0,
              0.0, 1.0, 0.0, 0.0,
              0.0, 0.0, 1.0, 0.0,
              ${by.x ? by.x : "0.0"}, ${by.y ? by.y : "0.0"}, ${by.z ? by.z : "0.0"}, 1.0)`;
            case "rotate":
              return `mat4(
              fCosZ${_index} * fCosY${_index}, fSinZ${_index} * fCosY${_index}, -fSinY${_index}, 0.0,
              fCosZ${_index} * fSinY${_index} * fSinX${_index} - fSinZ${_index} * fCosX${_index}, fSinZ${_index} * fSinY${_index} * fSinX${_index} + fCosZ${_index} * fCosX${_index}, fCosY${_index} * fSinX${_index}, 0.0,
              fCosZ${_index} * fSinY${_index} * fCosX${_index} + fSinZ${_index} * fSinX${_index}, fSinZ${_index} * fSinY${_index} * fCosX${_index} - fCosZ${_index} * fSinX${_index}, fCosY${_index} * fCosX${_index}, 0.0,
              0.0, 0.0, 0.0, 1.0
              )`;
            case "scale":
              return `mat4(
              ${by.x ? by.x : "1.0"}, 0.0, 0.0, 0.0,
              0.0, ${by.y ? by.y : "1.0"}, 0.0, 0.0,
              0.0, 0.0, ${by.z ? by.z : "1.0"}, 0.0,
              0.0, 0.0, 0.0, 1.0
              )`;
            default:
              return "";    
          }
        })
        .reduce( (_accumulator: string, _code: string) => `${_accumulator} * \n${_code}`);
      code += ";\n";

      return code;
    }

    private static generateColor(_color: CodeMutator): string {
      let code: string = "";
      if (_color) {
        code += `v_vctColor = vec4(${_color.r ? _color.r : "1.0"}, ${_color.g ? _color.g : "1.0"}, ${_color.b ? _color.b : "1.0"}, ${_color.a ? _color.a : "1.0"});`;
      }

      return code;
    }
    //#endregion
  }
}