const precompileScriptValue =
  require("shared/lib/scriptValue/helpers").precompileScriptValue;
const optimiseScriptValue =
  require("shared/lib/scriptValue/helpers").optimiseScriptValue;

export const id = "PG_VM_SET_INDIRECT";
export const name = "Set Indirect Variable (VM_SET_INDIRECT)";
export const groups = ["EVENT_GROUP_VARIABLES", "PG Plugins"];
export const subGroups = {
  EVENT_GROUP_VARIABLES: "Indirect Variables",
  "PG Plugins": "Indirect Variables",
};

const EVENT_DESCRIPTION =
  "Assigns variable that is addressed indirectly to the other variable.";
const EVET_IDXA_DESC = "Index of the target variable.";
const EVET_IDXB_DESC = "Value to be assigned to the target variable.";

export const fields = [
  {
    label: EVENT_DESCRIPTION,
    width: "100%",
    flexBasis: "100%",
  },
  {
    key: "index",
    label: "Index",
    description: EVET_IDXA_DESC,
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
    key: "source",
    label: "Value",
    description: EVET_IDXB_DESC,
    type: "value",
    width: "25%",
    flexBasis: "25%",
    defaultValue: {
      type: "variable",
      value: "LAST_VARIABLE",
    },
    flexBasis: "25%",
  },
];

export const compile = (input, helpers) => {
  const {
    _addComment,
    _addNL,
    _setInd,
    _rpn,
    _declareLocal,
    _performFetchOperations,
    _performValueRPN,
    markLocalsUsed,
    getVariableAlias,
    variableFromUnion,
  } = helpers;
  const { index, source } = input;

  _addComment("************************************");
  _addComment("Event: " + id);
  _addComment(`${name}`);
  _addComment("************************************");

  // resolve the parameters to variables if needed
  const [rpnOpsIndex, fetchOpsIndex] = precompileScriptValue(
    optimiseScriptValue(index)
  );
  const [rpnOpsValue, fetchOpsValue] = precompileScriptValue(
    optimiseScriptValue(source)
  );

  if (
    rpnOpsIndex.length === 1 &&
    (rpnOpsIndex[0].type === "variable" || rpnOpsIndex[0].type === "number") &&
    rpnOpsValue.length === 1 &&
    (rpnOpsValue[0].type === "variable" || rpnOpsValue[0].type === "number")
  ) {
    _addComment(`-- optimize for variables/numbers`);
    const IDXA = getVariableAlias(variableFromUnion(rpnOpsIndex[0], "T0"));
    const IDXB = getVariableAlias(variableFromUnion(rpnOpsValue[0], "T1"));
    _addComment(`-- ${EVENT_DESCRIPTION}`);
    _addComment(`@param IDXA : ${IDXA} - ${EVET_IDXA_DESC}`);
    _addComment(`@param IDXB : ${IDXB} - ${EVET_IDXB_DESC}`);
    _setInd(IDXA, IDXB);
  } else {
    const idx = _declareLocal("idx", 1, true);
    const val = _declareLocal("val", 1, true);

    const localsLookup = _performFetchOperations([
      ...fetchOpsIndex,
      ...fetchOpsValue,
    ]);

    const rpn = _rpn();
    _performValueRPN(rpn, rpnOpsIndex, localsLookup);
    rpn.refSet(idx);
    _performValueRPN(rpn, rpnOpsValue, localsLookup);
    rpn.refSet(val);
    rpn.stop();

    _addComment(`-- ${EVENT_DESCRIPTION}`);
    _addComment(`@param IDXA : ${getVariableAlias(idx)} - ${EVET_IDXA_DESC}`);
    _addComment(`@param IDXB : ${getVariableAlias(val)} - ${EVET_IDXB_DESC}`);
    _setInd(idx, val);

    // free up local variables
    markLocalsUsed(idx, val);
  }

  _addComment(`-- ENDOF ${id}`);
  _addNL();
};
