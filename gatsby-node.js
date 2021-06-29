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
    moduleField: Joi.string().default("module").description("Property that contains the data to expose")
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

async function onCreateNode(args, pluginOptions) {
  const {
    node,
    actions: {
      createNode,
      createParentChildLink
    },
    createNodeId,
    createContentDigest,
    reporter
  } = args;
  const {
    sourceType,
    typeField,
    moduleField
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
    const typeName = (0, _lodash.upperFirst)((0, _lodash.camelCase)(type + " Doc"));
    const jsonNode = { ...module,
      id: createNodeId(`${node.id} ${type}`),
      parent: node.id,
      children: [],
      internal: {
        contentDigest: createContentDigest(module),
        type: typeName,
        owner: ""
      }
    };
    createNode(jsonNode);
    createParentChildLink({
      parent: node,
      child: jsonNode
    });
  } else {
    reporter.info(`No match with ${type}: ${JSON.stringify(module)}`);
  }
}