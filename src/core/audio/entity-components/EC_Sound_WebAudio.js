
define([
    "entity-components/EC_Sound"
    ], function(EC_Sound) {

/**
    This base implementation does not do anything. It declared the static attribute structure of EC_Sound
    in the Tundra protocol.

    Renderer implementations need to provide this components functionality, preferably by extending this object.

    @class EC_Sound_WebAudio
    @extends EC_Sound
    @constructor
*/
var EC_Sound_WebAudio = EC_Sound.$extend(
{
    __init__ : function(id, typeId, typeName, name)
    {
        this.$super(id, typeId, typeName, name);
    },

    __classvars__ :
    {
        Implementation : "webaudio"
    },

    update : function()
    {
        if (this.soundRef != "")
            this.load(this.soundRef);
    },

    attributeChanged : function(index, name, value)
    {
        switch(index)
        {
        case 0: // sound ref
            break;
        case 4: // play on creation
            break;
        case 5:
            break;
        default:
            break;
        }
    },

    load : function(value)
    {
    }
});

return EC_Sound_WebAudio;

}); // require js