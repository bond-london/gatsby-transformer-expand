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
  });
}

export function unstable_shouldOnCreateNode(
  { node }: { node: Node },
  { sourceType }: Options
) {
  // We only care about JSON content.
  return node.internal.type === sourceType;
}

export async function onCreateNode(
  args: CreateNodeArgs,
  pluginOptions: Options
) {
  const {
    node,
    actions: { createNode, createParentChildLink },
    createNodeId,
    createContentDigest,
    reporter,
  } = args;
  const { sourceType, typeField, moduleField } = pluginOptions;
  if (!unstable_shouldOnCreateNode({ node }, pluginOptions)) {
    return;
  }

  const type = node[typeField] as string;
  const module = node[moduleField] as any;

  if (isString(type) && isPlainObject(module)) {
    reporter.info(`Got object of ${type}`);
    const typeName = upperFirst(camelCase(type + " Doc"));
    const jsonNode: Node = {
      ...module,
      id: createNodeId(`${node.id} ${type}`),
      parent: node.id,
      children: [],
      internal: {
        contentDigest: createContentDigest(module),
        type: typeName,
        owner: "",
      },
    };
    createNode(jsonNode);
    createParentChildLink({ parent: node, child: jsonNode });
  } else {
    reporter.info(`No match with ${type}: ${JSON.stringify(module)}`);
  }
}
