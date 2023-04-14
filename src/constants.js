const CONSTANTS = {
  MODULE_NAME: "sequencer",
  FLAG_NAME: "effects",
  COLOR: {
    PRIMARY: 0xEE442F,
    SECONDARY: 0x601A4A,
    TERTIARY: 0x601A4A
  },
  SHAPES: {
    POLY: "polygon",
    RECT: "rectangle",
    CIRC: "circle",
    ELIP: "ellipse",
    RREC: "roundedRect",
  },
  FEET_REGEX: new RegExp(/\.[0-9]+ft\.*/g),
  ARRAY_REGEX: new RegExp(/\.[0-9]$/g)
}

CONSTANTS.INTEGRATIONS = {};
CONSTANTS.INTEGRATIONS.ISOMETRIC = {};
CONSTANTS.INTEGRATIONS.ISOMETRIC.ACTIVE = false;
CONSTANTS.INTEGRATIONS.ISOMETRIC.MODULE_NAME = "grape_juice-isometrics";
CONSTANTS.INTEGRATIONS.ISOMETRIC.SCENE_ENABLED = `flags.${CONSTANTS.INTEGRATIONS.ISOMETRIC.MODULE_NAME}.is_isometric`;
CONSTANTS.INTEGRATIONS.ISOMETRIC.PROJECTION_FLAG = `flags.${CONSTANTS.INTEGRATIONS.ISOMETRIC.MODULE_NAME}.original_image_projection_type`;
CONSTANTS.INTEGRATIONS.ISOMETRIC.PROJECTION_TYPES = {
  TOPDOWN: "topdown",
  TRUE: "true_isometric",
  DIAMETRIC: "diametric"
}
CONSTANTS.INTEGRATIONS.ISOMETRIC.ISOMETRIC_CONVERSION = Math.sqrt(3);
CONSTANTS.INTEGRATIONS.ISOMETRIC.DIMETRIC_CONVERSION = (2 / CONSTANTS.INTEGRATIONS.ISOMETRIC.ISOMETRIC_CONVERSION)
CONSTANTS.INTEGRATIONS.ISOMETRIC.DUNGEON_BUILDER_CONVERSION = ((278/154) / CONSTANTS.INTEGRATIONS.ISOMETRIC.ISOMETRIC_CONVERSION)

CONSTANTS.EFFECTS_FLAG = `flags.${CONSTANTS.MODULE_NAME}.${CONSTANTS.FLAG_NAME}`;

export default CONSTANTS;
