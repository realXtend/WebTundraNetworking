
define(["core/framework/TundraSDK",
        "lib/ammo",
        "core/scene/Scene",
        "core/scene/IComponent",
        "core/scene/Attribute",
        "core/scene/AttributeChange",
        "core/physics/PhysicsWorld"
    ], function(TundraSDK, Ammo, Scene, IComponent, Attribute, AttributeChange, PhysicsWorld) {

/**
    @class EC_RigidBody
    @extends IComponent
    @constructor
*/
var EC_RigidBody = IComponent.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);

        /**
            @property mass (attribute)
            @type Attribute
        */
        this.declareAttribute(0, "mass", 0.0, Attribute.Real);
        /**
            @property shapeType (attribute)
            @type Attribute
        */
        this.declareAttribute(1, "shapeType", EC_RigidBody.ShapeType.Box, Attribute.Int);
        /**
            @property size (attribute)
            @type Attribute
        */
        this.declareAttribute(2, "size", new THREE.Vector3(1.0, 1.0, 1.0), Attribute.Float3);
        /**
            @property collisionMeshRef (attribute)
            @type Attribute
        */
        this.declareAttribute(3, "collisionMeshRef", "", Attribute.AssetReference);
        /**
            @property friction (attribute)
            @type Attribute
        */
        this.declareAttribute(4, "friction", 0.5, Attribute.Real);
        /**
            @property linearDamping (attribute)
            @type Attribute
        */
        this.declareAttribute(5, "linearDamping", 0.0, Attribute.Real);
        /**
            @property angularDamping (attribute)
            @type Attribute
        */
        this.declareAttribute(6, "angularDamping", 0.0, Attribute.Real);
        /**
            @property linearFactor (attribute)
            @type Attribute
        */
        this.declareAttribute(7, "linearFactor", new THREE.Vector3(1.0, 1.0, 1.0), Attribute.Float3);
        /**
            @property angularFactor (attribute)
            @type Attribute
        */
        this.declareAttribute(8, "angularFactor", new THREE.Vector3(1.0, 1.0, 1.0), Attribute.Float3);
        /**
            @property linearVelocity (attribute)
            @type Attribute
        */
        this.declareAttribute(9, "linearVelocity", new THREE.Vector3(0.0, 0.0, 0.0), Attribute.Float3);
        /**
            @property angularVelocity (attribute)
            @type Attribute
        */
        this.declareAttribute(10, "angularVelocity", new THREE.Vector3(0.0, 0.0, 0.0), Attribute.Float3);
        /**
            @property kinematic (attribute)
            @type Attribute
        */
        this.declareAttribute(11, "kinematic", false, Attribute.Bool);
        /**
            @property phantom (attribute)
            @type Attribute
        */
        this.declareAttribute(12, "phantom", false, Attribute.Bool);
        /**
            @property drawDebug (attribute)
            @type Attribute
        */
        this.declareAttribute(13, "drawDebug", false, Attribute.Bool);
        /**
            @property collisionLayer (attribute)
            @type Attribute
        */
        this.declareAttribute(14, "collisionLayer", -1, Attribute.Int);
        /**
            @property collisionMask (attribute)
            @type Attribute
        */
        this.declareAttribute(15, "collisionMask", -1, Attribute.Int);
        /**
            @property rollingFriction (attribute)
            @type Attribute
        */
        this.declareAttribute(16, "rollingFriction", 0.5, Attribute.Real);
        /**
            @property useGravity (attribute)
            @type Attribute
        */
        this.declareAttribute(17, "useGravity", true, Attribute.Bool);
        
        this.btCollisionshape_ = null;
        this.btRigidbody_ = null;
        
        // TODO! use btMotionState if possible
        TundraSDK.framework.frame.onUpdate(this, this.onFrame_);
        
        this.ignoreTransformChange_ = false;
        this.parentChangedEvent_ = null;
    },
    
    reset : function()
    {
        this.removeCollisionShape();
        this.removeBody();
    },
    
    __classvars__ : {
        ShapeType : {
            Box:0,
            Sphere:1,
            Cylinder:2,
            Capsule:3,
            TriMesh:4,
            HeightField:5,
            ConvexHull:6,
            Cone:7
        }
    },
    
    attributeChanged : function(index, name, value)
    {
        console.log("Attribute '" + name +  "' changed to " + value);
        switch(index)
        {
            case 0: // Mass
                this.createBody();
                break;
            case 1: // ShapeType
                this.createBody();
                break;
            case 2: // Size
                this.createBody();
                //this.updateScale();
                break;    
            case 3: // CollisionMeshRef
                break;
            case 4: // Friction
                break;
            case 5: // LinearDamping
                break;
            case 6: // AngularDamping
                break;
            case 7: // LinearFactor
                break;
            case 8: // AngularFactor
                break;
            case 9: // LinearVelocity
                break;
            case 10: // AngularVelocity
                break;
            case 11: // Kinematic
                break;    
            case 12: // Phantom
                break;
            case 13: // DrawDebug
                break;
            case 14: // CollisionLayer
                break;
            case 15: // CollisionMask
                break;
            case 16: // RollingFriction
                break;
            case 17: // UseGravity
                break;
        }
    },
    
    /// Force the body to activate (wake up)
    activate : function()
    {
        if (this.btRigidbody_ === undefined ||
            this.btRigidbody_ === null)
            this.btRigidbody_.activate();
    },
    
    setParent : function(entity)
    {
        this.$super(entity);
        
        if (this.btRigidbody_ === null)
            this.createBody();
        
        if (this.parentChangedEvent_ !== null)
            TundraSDK.framework.events.unsubscribe(this.parentChangedEvent_.channel,
                                                   this.parentChangedEvent_.id);
        
        if (this.parentEntity !== undefined && this.parentEntity !== null)
            this.parentChangedEvent_ = this.parentEntity.placeable.onAttributeChanged(this, this.onPlaceableUpdated);
    },
    
    onPlaceableUpdated : function(entity, component, attributeIndex, attributeName, attributeValue)
    {
        if (this.btRigidbody_ === undefined ||
            this.btRigidbody_ === null ||
            attributeIndex !== 0)
            return;
        
        var pos = this.parentEntity.placeable.position();
        this.setRigidbodyPosition(pos.x, pos.y, pos.z);
    },
    
    isPrimitiveShape : function()
    {
        switch(this.attributes.shapeType.get())
        {
            case EC_RigidBody.ShapeType.TriMesh:
            case EC_RigidBody.ShapeType.HeightField:
            case EC_RigidBody.ShapeType.ConvexHull:
                return false;
                break;
            default:
                return true;
        }
    },
    
    setMass : function(mass){
        var localInertia = new Ammo.btVector3(0.0, 0.0, 0.0);
        if (mass > 0.0)
            this.btCollisionshape_.calculateLocalInertia(mass, localInertia);
    },
    
    createBody : function()
    {
        if (this.parentEntity.placeable === undefined ||
            this.parentEntity.placeable === null)
            return;
        
        this.removeBody();
        this.createCollisionShape();
        
        var mass = this.attributes.mass.get();
        var pos = this.parentEntity.placeable.position();
        
        var startTransform = new Ammo.btTransform();
        startTransform.setIdentity();
        startTransform.setOrigin(pos.x, pos.y, pos.z);
        //console.log("x:" + pos.x + " y:" + pos.y + " z:" + pos.z + " n:" + this.parentEntity.name);
        
        var localInertia = new Ammo.btVector3(0.0, 0.0, 0.0);
        if (mass > 0.0)
            this.btCollisionshape_.calculateLocalInertia(mass, localInertia);
        
        var myMotionState = new Ammo.btDefaultMotionState(startTransform);
        
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass,
                                                          myMotionState,
                                                          this.btCollisionshape_,
                                                          localInertia);
        this.btRigidbody_ = new Ammo.btRigidBody(rbInfo);
        
        TundraSDK.framework.physicsWorld.world.addRigidBody(this.btRigidbody_);
        
        Ammo.destroy(localInertia);
        Ammo.destroy(startTransform);
        localInertia = null;
        startTransform = null;
    },
    
    removeBody : function()
    {
        if (this.btRigidbody_ === undefined ||
            this.btRigidbody_ === null)
            return;
        
        TundraSDK.framework.physicsWorld.world.removeRigidBody(this.btRigidbody_);
        Ammo.destroy(this.btRigidbody_);
        this.btRigidbody_ = null;
    },
    
    createCollisionShape : function()
    {
        this.removeCollisionShape();
        
        var shape = this.attributes.shapeType.get();
        var size = this.attributes.size.get();
        
        if (shape === EC_RigidBody.ShapeType.Box)
            this.btCollisionshape_ = new Ammo.btBoxShape(new Ammo.btVector3(size.x, size.y, size.z));
        else if (shape === EC_RigidBody.ShapeType.Sphere)
            this.btCollisionshape_ = new Ammo.btSphereShape(size.x * 0.5);
        else if (shape === EC_RigidBody.ShapeType.Cylinder)
            this.btCollisionshape_ = new Ammo.btCylinderShape(new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5));
        else if (shape === EC_RigidBody.ShapeType.Capsule)
            this.btCollisionshape_ = new Ammo.btCapsuleShape(size.x * 0.5, size.y * 0.5);
        /*else if (shape === EC_RigidBody.ShapeType.TriMesh)
            this.btCollisionshape_ = new Ammo.btBoxShape(btSize);
        else if (shape === EC_RigidBody.ShapeType.HeightField)
            this.btCollisionshape_ = new Ammo.btBoxShape(btSize);
        else if (shape === EC_RigidBody.ShapeType.ConvexHull)
            this.btCollisionshape_ = new Ammo.btBoxShape(btSize);*/
        else if (shape === EC_RigidBody.ShapeType.Cone)
            this.btCollisionshape_ = new Ammo.btConeShape(size.x * 0.5, size.y);
        
        this.updateScale();
        return this.btCollisionshape_;
    },
    
    removeCollisionShape : function() {
        if (this.btCollisionshape_ === undefined ||
            this.btCollisionshape_ === null)
            return;
        
        Ammo.destroy(this.btCollisionshape_);
        this.btCollisionshape_ = null;
    },
    
    onFrame_ : function()
    {
        this.updateTransformPosition();
    },
    
    updateTransformPosition : function()
    {
        if (this.ignoreTransformChange_ ||
            this.btRigidbody_ === undefined ||
            this.btRigidbody_ === null ||
            this.parentEntity.placeable === undefined ||
            this.parentEntity.placeable === null)
            return;
        
        this.ignoreTransformChange_ = true;
        
        var transform = new Ammo.btTransform();
        this.rigidbody.getMotionState().getWorldTransform(transform);
        var origin = transform.getOrigin();
        var rot = transform.getRotation();
        console.log("x:" + origin.x() + " y:" + origin.y() + " z:" + origin.z() + " n:" + this.parentEntity.name);
        
        var t = this.parentEntity.placeable.transform;
        t.setPosition(origin.x(), origin.y(), origin.z());
        t.setFromQuaternion(rot.x(), rot.y(), rot.z(), rot.w());
        this.parentEntity.placeable.transform = t;
        
        this.ignoreTransformChange_ = false;
    },
    
    setRigidbodyPosition : function(x, y, z)
    {
        if (this.ignoreTransformChange_ ||
            this.btRigidbody_ === undefined ||
            this.btRigidbody_ === null)
            return;
        
        console.log(x + " " + y  + " " + z);
        var worldTrans = new Ammo.btTransform();
        this.btRigidbody_.getWorldTransform(worldTrans);
        worldTrans.setOrigin(new Ammo.btVector3(x, y, z));
        console.log(worldTrans.getOrigin().y());
        this.btRigidbody_.setWorldTransform(worldTrans);
        this.btRigidbody_.activate();
        console.log(this.btRigidbody_.getWorldTransform().getOrigin().y());
                
        //Ammo.destroy(worldTrans);
        //worldTrans = null;
    },
    
    updateScale : function()
    {
        return;
        if (this.btCollisionshape_ === undefined ||
            this.btCollisionshape_ === null ||
            this.parentEntity.placeable === undefined ||
            this.parentEntity.placeable === null)
            return;
        
        var sizeVec = this.size;
        var scale = this.parentEntity.placeable.transform.scale;
        // Sanitate the size
        if (sizeVec.x < 0.0)
            sizeVec.x = 0.0;
        if (sizeVec.y < 0.0)
            sizeVec.y = 0.0;
        if (sizeVec.z < 0.0)
            sizeVec.z = 0.0;
        
        if (this.shapeType === EC_RigidBody.ConvexHull ||
            this.shapeType === EC_RigidBody.TriMesh)
            this.btCollisionshape_.setLocalScaling(new Ammo.btVector3(scale.x, scale.y, scale.z));
        else
            this.btCollisionshape_.setLocalScaling(new Ammo.btVector3(sizeVec.x * scale.x, sizeVec.y * scale.y, sizeVec.z * scale.z));
    }
    
});

Scene.registerComponent(23, "EC_RigidBody", EC_RigidBody);

return EC_RigidBody;

}); // require js