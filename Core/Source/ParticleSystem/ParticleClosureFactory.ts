namespace FudgeCore {

  /**
   * A function taking input factors (time, index, size and self defined ones) as the argument. Returning a number.
  */
  export interface ParticleClosure {
    (_variables: ParticleVariables): number;
  }

  /**
   * Factory class to create closures.
   * @author Jonas Plotzky, HFU, 2020
   */
  export class ParticleClosureFactory {
    public static closures: { [key: string]: Function } = {
      "addition": ParticleClosureFactory.createAddition,
      "subtraction": ParticleClosureFactory.createSubtraction,
      "multiplication": ParticleClosureFactory.createMultiplication,
      "division": ParticleClosureFactory.createDivision,
      "modulo": ParticleClosureFactory.createModulo,
      "linear": ParticleClosureFactory.createLinear,
      "polynomial": ParticleClosureFactory.createPolynomial3,
      "squareRoot": ParticleClosureFactory.createSquareRoot,
      "random": ParticleClosureFactory.createRandom
    };

    /**
     * Creates a closure of the given function type and passes the parameters to it.
     * @param _function The function type of the closure you want to create.
     * @param _parameters The parameters, which should be functions themselves, passed to the created closure.
     */
    public static createClosure(_function: string, _parameters: Function[]): ParticleClosure {
      if (_function in this.closures)
        return this.closures[_function](_parameters);
      else
        throw `"${_function}" is not an operation`;
    }

    /**
     * Creates a closure which will return the sum of the given parameters,  
     *  i.e. ```_parameters[0] + ... + _parameters[n]```.
     */
    private static createAddition(_parameters: Function[]): Function {
      return function (_variables: ParticleVariables): number {
        // Debug.group("ClosureAddition");
        let result: number = 0;
        for (const param of _parameters) {
          result += param(_variables);
        }
        // Debug.groupEnd();
        return result;
      };
    }

    /**
     * Creates a closure which will return the subtraction of the given parameters,  
     *  i.e. ```_parameters[0] - _parameters[1]```.
     */
    private static createSubtraction(_parameters: Function[]): Function {
      return function (_variables: ParticleVariables): number {
        // Debug.group("ClosureSubtraction");
        let result: number = _parameters[0](_variables) - _parameters[1](_variables);
        // Debug.groupEnd();
        return result;
      };
    }

    /**
      * Creates a closure which will return the product of the given parameters,  
      *  i.e. ```_parameters[0] * ... * _parameters[n]```.
      */
    private static createMultiplication(_parameters: Function[]): Function {
      return function (_variables: ParticleVariables): number {
        // Debug.log("ClosureMultiplication");
        let result: number = 1;
        for (const param of _parameters) {
          result *= param(_variables);
        }
        // Debug.groupEnd();
        return result;
      };
    }

    /**
     * Creates a closure which will return the division of the given parameters,  
     *  i.e. ```_parameters[0] / _parameters[1]```.
     */
    private static createDivision(_parameters: Function[]): Function {
      return function (_variables: ParticleVariables): number {
        // Debug.group("ClosureDivision");
        let result: number = _parameters[0](_variables) / _parameters[1](_variables);
        // Debug.groupEnd();
        return result;
      };
    }

    /**
     * Creates a closure which will return the modulo of the given parameters,  
     *  i.e. ```_parameters[0] % _parameters[1]```.
     */
    private static createModulo(_parameters: Function[]): Function {
      return function (_variables: ParticleVariables): number {
        // Debug.group("ClosureModulo");
        let result: number = _parameters[0](_variables) % _parameters[1](_variables);
        // Debug.groupEnd();
        return result;
      };
    }

    /**
     * Interpolates a linear function between two given points.
     * - ```_parameters[0]``` will be the input value for the function.
     * - ```_parameters[1]``` x start value.
     * - ```_parameters[2]``` y start value.
     * - ```_parameters[3]``` x end value.
     * - ```_parameters[4]``` y end value.
     */
    private static createLinear(_parameters: Function[]): Function {
      let xStart: number = _parameters[1]();
      let yStart: number = _parameters[2]();
      let xEnd: number = _parameters[3]();
      let yEnd: number = _parameters[4]();
      return function (_variables: ParticleVariables): number {
        // Debug.group("ClosureLinear");
        let x: number = _parameters[0](_variables);
        let y: number = yStart + (x - xStart) * (yEnd - yStart) / (xEnd - xStart);
        // Debug.log(xEnd);
        // Debug.groupEnd();
        return y;
      };
    }

    /**
     * Creates a polynomial function of third degree. A,b,c and d will be evaluated while parsing.
     * - ```_parameters[0]``` will be the input value for the function.  
     * - ```_parameters[1]``` a value.
     * - ```_parameters[2]``` b value.
     * - ```_parameters[3]``` c value.
     * - ```_parameters[4]``` d value.
     */
    private static createPolynomial3(_parameters: Function[]): Function {
      let a: number = _parameters[1]();
      let b: number = _parameters[2]();
      let c: number = _parameters[3]();
      let d: number = _parameters[4]();
      return function (_variables: ParticleVariables): number {
        // Debug.group("ClosurePolynomial3");
        let x: number = _parameters[0](_variables);
        let y: number = a * Math.pow(x, 3) + b * Math.pow(x, 2) + c * x + d;
        // Debug.groupEnd();
        return y;
      };
    }

    /**
     * Creates a closure which will return the square root of the given parameter,  
     * ```parameters[0]``` will be the input value for the function.
     */
    private static createSquareRoot(_parameters: Function[]): Function {
      return function (_variables: ParticleVariables): number {
        // Debug.group("ClosureSquareRoot");
        let x: number = _parameters[0](_variables);
        let y: number = Math.sqrt(x);
        // Debug.groupEnd();
        return y;
      };
    }

    /**
     * Creates a closure which will return a number chosen from the randomNumbers array in _variables.
     * - ```_parameters[0]``` representing the index of the number which will be chosen.  
     */
    private static createRandom(_parameters: Function[]): Function {
      return function (_variables: ParticleVariables): number {
        // Debug.group("ClosureRandom");
        let result: number = (<number[]>_variables[PARTICLE_VARIBALE_NAMES.RANDOM_NUMBERS])[_parameters[0](_variables)];
        // Debug.groupEnd();
        return result;
      };
    }
  }
}