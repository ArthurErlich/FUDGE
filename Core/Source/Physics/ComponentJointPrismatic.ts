namespace FudgeCore {
  /**
     * A physical connection between two bodies with a defined axe movement.
     * Used to create a sliding joint along one axis. Two RigidBodies need to be defined to use it.
     * A motor can be defined to move the connected along the defined axis. Great to construct standard springs or physical sliders.
     * 
     * ```plaintext
     *          JointHolder - attachedRigidbody
     *                    --------
     *                    |      |
     *          <---------|      |--------------> connectedRigidbody, sliding on one Axis, 1 Degree of Freedom
     *                    |      |
     *                    --------
     * ```
     * @author Marko Fehrenbach, HFU 2020
     */
  export class ComponentJointPrismatic extends ComponentJointAxial {
    public static readonly iSubclass: number = Component.registerSubclass(ComponentJointPrismatic);

    protected oimoJoint: OIMO.PrismaticJoint;
    protected config: OIMO.PrismaticJointConfig = new OIMO.PrismaticJointConfig();
    //Internally used variables - Joint Properties that are used even when no actual oimoJoint is currently existend

    private jointMotorForce: number = 0;

    /** Creating a prismatic joint between two ComponentRigidbodies only moving on one axis bound on a local anchorpoint. */
    constructor(_attachedRigidbody: ComponentRigidbody = null, _connectedRigidbody: ComponentRigidbody = null, _axis: Vector3 = new Vector3(0, 1, 0), _localAnchor: Vector3 = new Vector3(0, 0, 0)) {
      super(_attachedRigidbody, _connectedRigidbody);
      this.jointAxis = new OIMO.Vec3(_axis.x, _axis.y, _axis.z);
      this.anchor = new Vector3(_localAnchor.x, _localAnchor.y, _localAnchor.z);

      this.motorLimitUpper = 10;
      this.motorLimitLower = -10;
    }
    //#region Get/Set transfor of fudge properties to the physics engine
    /**
      * The maximum motor force in Newton. force <= 0 equals disabled. This is the force that the motor is using to hold the position, or reach it if a motorSpeed is defined.
     */
    public get motorForce(): number {
      return this.jointMotorForce;
    }
    public set motorForce(_value: number) {
      this.jointMotorForce = _value;
      if (this.oimoJoint != null) this.oimoJoint.getLimitMotor().motorForce = this.jointMotorForce;
    }
    //#endregion

    //#region Saving/Loading
    public serialize(): Serialization {
      let serialization: Serialization = {
        motorForce: this.motorForce,
        [super.constructor.name]: super.serialize()
      };
      return serialization;
    }

    public async deserialize(_serialization: Serialization): Promise<Serializable> {
      this.motorForce = _serialization.motorForce || this.jointMotorForce;
      super.deserialize(_serialization[super.constructor.name]);
      return this;
    }

    public getMutator(): Mutator {
      let mutator: Mutator = super.getMutator();
      mutator.motorForce = this.motorForce;
      return mutator;
    }
    //#endregion

    /** Actual creation of a joint in the OimoPhysics system */
    protected constructJoint(): void {
      this.translationMotor = new OIMO.TranslationalLimitMotor().setLimits(this.motorLimitLower, this.motorLimitUpper); //Create motor settings, to hold positions, set constraint min/max
      this.translationMotor.setMotor(this.motorSpeed, this.motorForce);

      this.config = new OIMO.PrismaticJointConfig(); //Create a specific config for this joint type that is calculating the local axis for both bodies
      super.constructJoint();

      this.config.springDamper = this.springDamper; //Telling the config to use the motor/spring of the Fudge Component
      this.config.limitMotor = this.translationMotor;

      this.oimoJoint = new OIMO.PrismaticJoint(this.config);
      this.configureJoint();
    }
  }
}