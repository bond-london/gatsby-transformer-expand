"use strict";

exports.__esModule = true;
exports.pluginOptionsSchema = pluginOptionsSchema;
exports.unstable_shouldOnCreateNode = unstable_shouldOnCreateNode;
exports.onCreateNode = onCreateNode;

var _lodash = require("lodash");

function pluginOptionsSchema({
  Joi
}) {
  return Joi.object({
    sourceType: Joi.string().default("DocsJson").description("Source type to get data from"),
    typeField: Joi.string().default("type").description("Field to use to identify the type"),
    moduleField: Joi.string().default("module").description("Property that contains the data to expose"),
    unNest: Joi.number().default(1).description("Number of levels to traverse up to get the the parent")
  });
}

function unstable_shouldOnCreateNode({
  node
}, {
  sourceType
}) {
  // We only care about JSON content.
  return node.internal.type === sourceType;
}

function getParent(getNode, node, unNest) {
  const parent = node.parent;

  if (!parent) {
    return node;
  }

  const parentNode = getNode(parent);

  if (unNest <= 1) {
    return parentNode;
  }

  return getParent(getNode, parentNode, unNest - 1);
}

async function onCreateNode(args, pluginOptions) {
  const {
    node,
    actions: {
      createNode,
      createParentChildLink
    },
    getNode,
    createNodeId,
    createContentDigest,
    reporter
  } = args;
  const {
    typeField,
    moduleField,
    unNest
  } = pluginOptions;

  if (!unstable_shouldOnCreateNode({
    node
  }, pluginOptions)) {
    return;
  }

  const type = node[typeField];
  const module = node[moduleField];

  if ((0, _lodash.isString)(type) && (0, _lodash.isPlainObject)(module)) {
    reporter.info(`Got object of ${type}`);
    const parentNode = getParent(getNode, node, unNest);
    const typeName = (0, _lodash.upperFirst)((0, _lodash.camelCase)(type + " Doc"));
    const jsonNode = { ...module,
      id: createNodeId(`${parentNode.id} ${type}`),
      parent: parentNode.id,
      children: [],
      internal: {
        contentDigest: createContentDigest(module),
        type: typeName,
        owner: ""
      }
    };
    createNode(jsonNode);
    createParentChildLink({
      parent: parentNode,
      child: jsonNode
    });
  } else {
    reporter.info(`No match with ${type}: ${JSON.stringify(module)}`);
  }
}