const l10n = require("../helpers/l10n").default;

const MAX_VALUE = 217 - 31;

export const id = "PG_EVENT_GBC_PALETTE_RAINBOW";
export const name = "GBC Palette Rainbow";
export const groups = ["EVENT_GROUP_COLOR", "PG Plugins"];
export const subGroups = {
  EVENT_GROUP_COLOR: "GBC Palette Colors",
  "PG Plugins": "GBC Palette Colors",
};

const EVENT_DESCRIPTION = "Apply an raindow colour cycle to a palette.";

const clampColor = (val) => {
  if (val < 0) return 0;
  if (val > 31) return 31;
  return val;
};

export const fields = [
  {
    label: EVENT_DESCRIPTION,
    width: "100%",
    flexBasis: "100%",
  },
  {
    key: "value",
    label: "Start Hue",
    description: `The colour of the raindow between 1 and ${MAX_VALUE}`,
    type: "slider",
    min: 1,
    max: MAX_VALUE,
    defaultValue: 1,
  },
  {
    key: "max",
    label: "Max Hue",
    description: `The colour of the raindow between 1 and ${MAX_VALUE}`,
    type: "slider",
    min: 1,
    max: MAX_VALUE,
    defaultValue: MAX_VALUE,
  },
  {
    type: "group",
    fields: [
      {
        key: "type",
        label: "Layer",
        type: "select",
        options: [
          ["bkg", "Background Palette"],
          ["sprite", "Sprite Palette"],
        ],
        defaultValue: "bkg",
      },
      {
        key: "palette",
        label: "Palette",
        type: "select",
        options: [
          [0, "Palette 1"],
          [1, "Palette 2"],
          [2, "Palette 3"],
          [3, "Palette 4"],
          [4, "Palette 5"],
          [5, "Palette 6"],
          [6, "Palette 7"],
          [7, "Palette 8"],
        ],
        defaultValue: 0,
      },
      {
        key: "channel",
        label: "Channel",
        type: "select",
        options: [
          [0, "Channel 1"],
          [1, "Channel 2"],
          [2, "Channel 3"],
          [3, "Channel 4"],
        ],
        defaultValue: 0,
      },
    ]
  },
  {
    type: "group",
    fields: [
      {
        key: "step",
        label: "Step",
        description: `Amount to add to the hue value with each update`,
        type: "number",
        width: "25%",
        min: 1,
        max: MAX_VALUE,
        defaultValue: 1,
        flexBasis: "25%",
      },
      {
        key: "frames",
        label: "Wait Frames",
        description: `Update delay in frames`,
        type: "number",
        width: "25%",
        min: 0,
        max: 255,
        defaultValue: 5,
        flexBasis: "25%",
      },
    ],
  },
];

export const compile = (input, helpers) => {
  const {
    _addNL,
    _addComment,
    _addCmd,
    _idle,
    getVariableAlias,
    _setConst,
    appendRaw,
    getNextLabel,
  } = helpers;
  //const { sys, pal, c0, c1, c2, c3, type, cpal } = input;

  let R, G, B;
  const labelAssemblySubroutine = getNextLabel();
  const l2 = getNextLabel();

  // _addComment("screnId = " + input.sceneId);
  // const { scenes } = options;
  // const scene = scenes.find((s) => s.id === input.sceneId);
  // TOD work out how to get the bank id in this code
  const bank = "___bank_actor_0_update";

  _addComment("scene.bank = " + bank);

  let type = input.type === "bkg" ? "bkg" : "sprite";
  let cpal = input.palette >= 0 && input.palette <= 7 ? input.palette : 0;
  let c = input.channel >= 0 && input.channel <= 3 ? input.channel : 0;
  let r = [31, 0, 0, 0];
  let g = [0, 0, 0, 0];
  let b = [0, 0, 0, 0];
  let step = input.step > 0 ? input.step : 4;
  let maxValue = input.step > 0 ? input.max : MAX_VALUE;
  let frames = input.frames > 0 ? input.frames : 1;
  let v = input.value >= 0 && input.value < MAX_VALUE ? input.value : 0;

  for (; v < maxValue; v += step) {
    // wait for i number of frames
    for (let f = 0; f < frames; f++) {
      _idle();
    }

    // clamp each color channel to 0 >= v <= 31
    R = clampColor(r[c]);
    G = clampColor(g[c]);
    B = clampColor(b[c]);

    // BLUE to PURPLE
    if (v > 155) {
      R = v - 155;
      G = 0;
      B = 31;
    }
    // CYAN to BLUE
    else if (v > 124) {
      R = 0;
      G = 124 - (v - 31);
      B = 31;
    }
    // GREEN to CYAN
    else if (v > 93) {
      R = 0;
      G = 31;
      B = v - 93;
    }
    // YELLOW to GREEN
    else if (v > 62) {
      R = 62 - (v - 31);
      G = 31;
      B = 0;
    }
    // RED to YELLOW
    else if (v > 31) {
      R = 31;
      G = v - 31;
      B = 0;
    }
    // PURPLE to RED
    else {
      R = 31;
      G = 0;
      B = 31 - v;
    }

    // clamp each color channel to 0 >= v <= 31
    r[c] = clampColor(R);
    g[c] = clampColor(G);
    b[c] = clampColor(B);

    const colorCode = (R & 0x1f) | ((G & 0x1f) << 5) | ((B & 0x1f) << 10);

    _addComment(
      `Set ${type} pallete=${cpal} channel=${c} color=${colorCode} (${R},${G},${B})`
    );

    // using T0, T1, T3 as method args for assembly subroutine
    _setConst(getVariableAlias("T0"), colorCode);
    _setConst(getVariableAlias("T1"), c);
    _setConst(getVariableAlias("T2"), cpal);

    // call the subroutine defined in the l1 label
    _addCmd("VM_CALL_NATIVE", bank, `${labelAssemblySubroutine}$`);
  }

  // jumps over the native code subroutine
  _addCmd("VM_JUMP", `${l2}$`);

  // Th
  // from https://discord.com/channels/554713715442712616/925672652339810335/931581094556499978
  appendRaw(
    `
      ; ${id}$ is a subroutine written in assembly code
      ${labelAssemblySubroutine}$:
        ld hl, #(_script_memory + (${getVariableAlias("T0")} << 1))
        ld a, (hl+)
        ld h, (hl)
        ld l, a
        push hl

        ld a, (_script_memory + (${getVariableAlias("T1")} << 1))
        ld h, a
        ld a, (_script_memory + (${getVariableAlias("T2")} << 1))
        ld l, a
        push hl

        call _set_${type}_palette_entry
        add sp, #4
        ret

      ; ${l2}$ used as goto to jump over the ${labelAssemblySubroutine}$ code
      ${l2}$:
      `
  );
  _addNL();
};
