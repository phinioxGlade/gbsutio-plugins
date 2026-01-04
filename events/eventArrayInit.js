export const id = "PG_ARRAY_1D_INIT";

export const name = "New Array (1D)";
export const groups = ["EVENT_GROUP_VARIABLES", "PG Plugins"];
export const subGroups = {
  EVENT_GROUP_VARIABLES: "Arrays",
  "PG Plugins": "Arrays",
};

export const fields = [
  {
    label: "Initialize a new array for a fixed size.",
    width: "100%",
    flexBasis: "100%",
  },
  {
    key: "arrayIndex",
    label: "Array Index",
    description: "The memory address to start the array at.",
    type: "value",
    width: "25%",
    min: 0,
    max: 511,
    defaultValue: {
      type: "number",
      value: 0,
    },
    flexBasis: "25%",
  },
  {
    key: "arraySize",
    label: "Array Size",
    description: "The size of the array to be initialized.",
    type: "value",
    min: 1,
    max: 256,
    width: "25%",
    defaultValue: {
      type: "number",
      value: 1,
    },
    flexBasis: "25%",
  },
  {
    key: "initValue",
    label: "Initial Value",
    description: "The value to initialize each element of the array to.",
    type: "value",
    min: 0,
    max: 255,
    width: "25%",
    defaultValue: {
      type: "number",
      value: 1,
    },
    flexBasis: "25%",
  },
];

export const compile = (input, helpers) => {
  const { _raiseException, _stackPushConst, _stackPop, _addComment, _setInd } =
    helpers;
  const { arrayIndex, arraySize, initValue } = input;

  _addComment("************************************");
  _addComment("Event: " + id);
  _addComment(`Initialize 1D Array`);
  _addComment("************************************");

  //const arrayCounterRef = _declareLocal("arrayCounter", 1, true);

  if ([arrayIndex, arraySize, initValue].every((e) => e.type === "number")) {
    // calculate the last index of the array.
    const lastIndex = arrayIndex.value + arraySize.value - 1;

    _addComment(
      "Initializing array indexes [" +
        arrayIndex.value +
        ":" +
        lastIndex +
        "], array size = " +
        arraySize.value
    );

    // argument validation
    if (arrayIndex.value < 0 || arrayIndex.value >= 512) {
      _raiseException(id + " arrayIndex out of bounds: " + arrayIndex.value, 1);
      return;
    }
    if (arraySize.value < 1) {
      _raiseException(id + " arraySize less than 1: " + arraySize.value, 1);
      return;
    }
    if (lastIndex.value < 0 || lastIndex.value >= 512) {
      _raiseException(id + " arraySize out of bounds: " + lastIndex, 1);
      return;
    }

    // push the init-value on the the stack
    _stackPushConst(initValue.value, "push init-value onto the stack");

    for (let i = arrayIndex.value; i <= lastIndex; i++) {
      _addComment("Initialize array index[" + i + "] = " + initValue.value);
      _stackPushConst(i);
      _setInd(".ARG0", ".ARG1");
      _stackPop(1);
    }

    // pop the init-value from the the stack
    _addComment("popping int-value from the stack");
    _stackPop(1);
  } else {
    _addComment("Not all numbers");
    
    _addComment("first index of the array");
    const idx = _declareLocal("idx", 1, true);
    variableSetToScriptValue(idx, arrayIndex);

    _addComment("size of the array to initialize");
    const size = _declareLocal("size", 1, true);
    variableSetToScriptValue(size, arraySize);

    _addComment("value to initialize");
    const value = _declareLocal("value", 1, true);
    variableSetToScriptValue(value, initValue);

    _addComment("calculate the last index of the array");
    const lastIndex = _declareLocal("lastIndex", 1, true);

    _addComment(getVariableAlias(idx) + " = array first index");
    _addComment(getVariableAlias(lastIndex) + " = array last index");
    _addComment(getVariableAlias(size) + " = array size");
    _addComment(getVariableAlias(value) + " = value to initialize");

    const loopId = getNextLabel();
    labelDefine(loopId);
    ifVariableCompareScriptValue(getVariableAlias(idx), ".LT", getVariableAlias(lastIndex), () => {
      _addComment("do something");
    });

    // free up local variables
    markLocalsUsed(idx, size, value, lastIndex);

    // // todo add support for
    // _raiseException(
    //   `${id} Unsupported arg type combo: arrayIndex=${arrayIndex.type}, arraySize=${arraySize.type}, initValue=${initValue.type}`,
    //   3
    // );
    // return;
  }
};
