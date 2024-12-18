const CONSTANTS = {
  MODULE_NAME: "sequencer",
  EFFECTS_FLAG_NAME: "effects",
  SOUNDS_FLAG_NAME: "sounds",
	IS_V12: false,
  COLOR: {
    PRIMARY: 0xee442f,
    SECONDARY: 0x601a4a,
    TERTIARY: 0x601a4a,
  },
  SHAPES: {
    POLY: "polygon",
    RECT: "rectangle",
    CIRC: "circle",
    ELIP: "ellipse",
    RREC: "roundedRect",
  },
  FEET_REGEX: new RegExp(/\.[0-9]+ft\.*/g),
  ARRAY_REGEX: new RegExp(/\.[0-9]$/g),
  STATUS: {
    READY: 0,
    RUNNING: 1,
    COMPLETE: 2,
    SKIPPED: 3,
    ABORTED: 4,
  },

	PLACEMENT_RESTRICTIONS: {
		ANYWHERE: "anywhere",
		LINE_OF_SIGHT: "lineOfSight",
		NO_COLLIDABLES: "noCollidables"
	},

	CALLBACKS: {
		SHOW: "show",
		MOUSE_MOVE: "mouseMove",
		MOVE: "move",
		COLLIDE: "collide",
		STOP_COLLIDING: "stopColliding",
		INVALID_PLACEMENT: "invalidPlacement",
		PLACED: "placed",
		CANCEL: "cancel"
	}
};

CONSTANTS.INTEGRATIONS = {};
CONSTANTS.INTEGRATIONS.ISOMETRIC = {};
CONSTANTS.INTEGRATIONS.ISOMETRIC.ACTIVE = false;
CONSTANTS.INTEGRATIONS.ISOMETRIC.MODULE_NAME = "grape_juice-isometrics";
CONSTANTS.INTEGRATIONS.ISOMETRIC.SCENE_ENABLED = `flags.${CONSTANTS.INTEGRATIONS.ISOMETRIC.MODULE_NAME}.is_isometric`;
CONSTANTS.INTEGRATIONS.ISOMETRIC.PROJECTION_FLAG = `flags.${CONSTANTS.INTEGRATIONS.ISOMETRIC.MODULE_NAME}.original_image_projection_type`;
CONSTANTS.INTEGRATIONS.ISOMETRIC.PROJECTION_TYPES = {
  TOPDOWN: "topdown",
  TRUE: "true_isometric",
  DIAMETRIC: "diametric",
};
CONSTANTS.INTEGRATIONS.ISOMETRIC.ISOMETRIC_CONVERSION = Math.sqrt(3);
CONSTANTS.INTEGRATIONS.ISOMETRIC.DIMETRIC_CONVERSION =
  2 / CONSTANTS.INTEGRATIONS.ISOMETRIC.ISOMETRIC_CONVERSION;
CONSTANTS.INTEGRATIONS.ISOMETRIC.DUNGEON_BUILDER_CONVERSION =
  278 / 154 / CONSTANTS.INTEGRATIONS.ISOMETRIC.ISOMETRIC_CONVERSION;

CONSTANTS.EFFECTS_FLAG = `flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.EFFECTS_FLAG_NAME}`;
CONSTANTS.REMOVE_EFFECTS_FLAG = `flags.${CONSTANTS.MODULE_NAME}.-=${CONSTANTS.EFFECTS_FLAG_NAME}`;
CONSTANTS.SOUNDS_FLAG = `flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.SOUNDS_FLAG_NAME}`;

export default CONSTANTS;
