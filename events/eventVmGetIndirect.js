const precompileScriptValue =
  require("shared/lib/scriptValue/helpers").precompileScriptValue;
const optimiseScriptValue =
  require("shared/lib/scriptValue/helpers").optimiseScriptValue;

export const id = "PG_VM_GET_INDIRECT";
export const name = "Get Indirect Variable (VM_GET_INDIRECT)";
export const groups = ["EVENT_GROUP_VARIABLES", "PG Plugins"];
export const subGroups = {
  EVENT_GROUP_VARIABLES: "Indirect Variables",
  "PG Plugins": "Indirect Variables",
};

const EVENT_DESCRIPTION =
  "Assigns a variable to the value of variable that is addressed indirectly.";
const EVET_IDXA_DESC =
  "The variable to be assigned with the value of the indirect.";
const EVET_IDXB_DESC = "Index of the source variable";

export const fields = [
  {
    label: EVENT_DESCRIPTION,
    width: "100%",
    flexBasis: "100%",
  },
  {
    key: "target",
    label: "Target Variable",
    description: EVET_IDXA_DESC,
    type: "variable",
    width: "25%",
    flexBasis: "25%",
  },
  {
    key: "index",
    label: "Index",
    description: EVET_IDXB_DESC,
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
];

export const compile = (input, helpers) => {
  const {
    _addComment,
    _addNL,
    _getInd,
    getVariableAlias,
    variableFromUnion,
    markLocalsUsed,
  } = helpers;
  const { target, index } = input;

  _addComment("************************************");
  _addComment("Event: " + id);
  _addComment(`${name}`);
  _addComment("************************************");

  // resolve the parameters to variables if needed
  const [rpnOpsIndex, fetchOpsIndex] = precompileScriptValue(
    optimiseScriptValue(index)
  );

  const IDXA = getVariableAlias(target);

  if (
    rpnOpsIndex.length === 1 &&
    (rpnOpsIndex[0].type === "variable" || rpnOpsIndex[0].type === "number")
  ) {
    _addComment(`-- optimize for variables/numbers`);
    // resolve the parameters to variables if needed
    const IDXB = getVariableAlias(variableFromUnion(index, "T0"));
    _addComment(`-- ${EVENT_DESCRIPTION}`);
    _addComment(`@param ${IDXA} = IDXA ${EVET_IDXA_DESC}`);
    _addComment(`@param ${IDXB} = IDXB ${EVET_IDXB_DESC}`);
    _getInd(IDXA, IDXB);
    markLocalsUsed(IDXB); // free up local variables
  } else {
    const IDXB = _declareLocal("idx", 1, true);
    const localsLookup = _performFetchOperations([...fetchOpsIndex]);
    const rpn = _rpn();
    _performValueRPN(rpn, rpnOpsIndex, localsLookup);
    rpn.refSet(idx);
    rpn.stop();

    _addComment(`-- ${EVENT_DESCRIPTION}`);
    _addComment(`@param ${IDXA} = IDXA ${EVET_IDXA_DESC}`);
    _addComment(`@param ${IDXB} = IDXB ${EVET_IDXB_DESC}`);
    _getInd(IDXA, IDXB);

    // free up local variables
    markLocalsUsed(IDXB);
  }

  _addComment(`-- ENDOF ${id}`);
  _addNL();
};
