import {
  CreateNodeArgs,
  Node,
  ParentSpanPluginArgs,
  PluginOptions,
  PluginOptionsSchemaArgs,
} from "gatsby";
import {
  camelCase,
  isArray,
  isFunction,
  isPlainObject,
  isString,
  upperFirst,
} from "lodash";
import { basename } from "path";

interface Options extends PluginOptions {
  sourceType: string;
  typeField: string;
  moduleField: string;
  unNest: number;
}

export function pluginOptionsSchema({ Joi }: PluginOptionsSchemaArgs) {
  return Joi.object({
    sourceType: Joi.string()
      .default("DocsJson")
      .description("Source type to get data from"),
    typeField: Joi.string()
      .default("type")
      .description("Field to use to identify the type"),
    moduleField: Joi.string()
      .default("module")
      .description("Property that contains the data to expose"),
    unNest: Joi.number()
      .default(1)
      .description("Number of levels to traverse up to get the the parent"),
  });
}

export function unstable_shouldOnCreateNode(
  { node }: { node: Node },
  { sourceType }: Options
) {
  // We only care about JSON content.
  return node.internal.type === sourceType;
}

function getParent(getNode: (id: string) => Node, node: Node, unNest: number) {
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

export async function onCreateNode(
  args: CreateNodeArgs,
  pluginOptions: Options
) {
  const {
    node,
    actions: { createNode, createParentChildLink },
    getNode,
    createNodeId,
    createContentDigest,
    reporter,
  } = args;
  const { typeField, moduleField, unNest } = pluginOptions;
  if (!unstable_shouldOnCreateNode({ node }, pluginOptions)) {
    return;
  }

  const type = node[typeField] as string;
  const module = node[moduleField] as any;

  if (isString(type) && isPlainObject(module)) {
    reporter.verbose(`Got object of ${type}`);
    const parentNode = getParent(getNode, node, unNest);
    const typeName = upperFirst(camelCase(type + " Doc"));
    const jsonNode: Node = {
      ...module,
      id: createNodeId(`${parentNode.id} ${type}`),
      parent: parentNode.id,
      children: [],
      internal: {
        contentDigest: createContentDigest(module),
        type: typeName,
        owner: "",
      },
    };
    createNode(jsonNode);
    createParentChildLink({ parent: parentNode, child: jsonNode });
  } else {
    reporter.info(`No match with ${type}: ${JSON.stringify(module)}`);
  }
}
