namespace FudgeCore {

  /**
   * Contains all the information which will be used to evaluate the closures of the particle effect. Current time and index, size and all the defined values of the storage partition of the effect will cached here while evaluating the effect. 
   */
  export interface ParticleVariables {
    [key: string]: number | number[];
  }

  /**
   * Attaches a {@link ParticleEffect} to the node.
   * @author Jonas Plotzky, HFU, 2020
   */
  export class ComponentParticleSystem extends Component {
    public static readonly iSubclass: number = Component.registerSubclass(ComponentParticleSystem);
    public variables: ParticleVariables = {};

    #particleEffect: ParticleEffect;
    // TODO: add color for the whole system

    constructor(_particleEffect: ParticleEffect = null, _size: number = 10) {
      super();
      this.#particleEffect = _particleEffect;
      this.variables[PARTICLE_VARIBALE_NAMES.TIME] = 0;
      this.variables[PARTICLE_VARIBALE_NAMES.INDEX] = 0;
      this.variables[PARTICLE_VARIBALE_NAMES.SIZE] = _size;
      this.initRandomNumbers(_size);

      // evaluate system storage
      this.evaluateStorage(this.#particleEffect?.storageSystem);
    }

    public get particleEffect(): ParticleEffect {
      return this.#particleEffect;
    }

    public set particleEffect(_newParticleEffect: ParticleEffect) {
      this.#particleEffect = _newParticleEffect;
      this.evaluateStorage(this.#particleEffect?.storageSystem);
    }

    public get size(): number {
      return <number>this.variables[PARTICLE_VARIBALE_NAMES.SIZE];
    }

    /**
     * Sets the size of the particle effect. Caution: Setting this will result in the reevaluation of the system storage of the effect and the reinitialization of the randomNumbers array.
     */
    public set size(_newSize: number) {
      this.variables[PARTICLE_VARIBALE_NAMES.SIZE] = _newSize;
      this.initRandomNumbers(_newSize);
      this.evaluateStorage(this.#particleEffect.storageSystem);
    }

    public evaluateStorage(_storageData: ParticleEffectData): void {
      for (const key in _storageData) {
        this.variables[key] = (<ParticleClosure>_storageData[key])(this.variables);
      }
    }

    //#region transfer
    public serialize(): Serialization {
      let serialization: Serialization = {
        [super.constructor.name]: super.serialize(),
        idParticleEffect: this.particleEffect.idResource
      };

      return serialization;
    }

    public async deserialize(_serialization: Serialization): Promise<Serializable> {
      await super.deserialize(_serialization[super.constructor.name]);
      this.particleEffect = <ParticleEffect>await Project.getResource(_serialization.idParticleEffect);

      return this;
    }

    public getMutatorForUserInterface(): MutatorForUserInterface {
      let mutator: MutatorForUserInterface = <MutatorForUserInterface>this.getMutator(true);
      mutator.particleEffect = this.particleEffect;
      return mutator;
    }
    //#endregion

    private initRandomNumbers(_size: number): void {
      let randomNumbers: number[] = [];
      for (let i: number = 0; i < _size + 10 /* so that its possible to have 10 different random numbers per index i.e. randomNumber(index + x) */; i++) {
        randomNumbers.push(Math.random());
      }
      this.variables[PARTICLE_VARIBALE_NAMES.RANDOM_NUMBERS] = randomNumbers;
    }
  }
}