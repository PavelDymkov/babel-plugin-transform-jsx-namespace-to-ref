const defaultRefAttributeBuilderType = "asThisProperty";
const pathSeparator = /[.\[\]]/;
const identifierTester = /^[A-z$][\w$]*$/;
const stringLiteralTester = /^(["].*["])|(['].*['])$/;
const numericLiteralTester = /^\d+$/;
const errors = {
    UNKNOWN_REFTYPE: "unknown refType, using default"
};

function hasValue(value) {
    return value;
}

function literalToString(stringLiteral) {
    return stringLiteral.slice(1, -1);
}

function trimString(string) {
    return typeof string == "string" ? string.trim() : "";
}


export default function({ types: t }) {
    const refAttributeBuilder = {
        asThisProperty(elementName, options) {
            let pathSource = createPathSourceStartWithThis(options.path);
            let path = createPath(pathSource);

            return createRefToPathHandler(elementName, path);
        },
        legacy(elementName) {
            return t.stringLiteral(elementName);
        }
    };

    function createPathSourceStartWithThis(source) {
        source = trimString(source);

        if (!source)
          return "this";

        if (source.startsWith("this"))
          return source;

        if (source.startsWith("["))
          return "this" + source;

        return "this." + source;
    }

    function createPath(pathString) {
        return trimString(pathString)
            .split(pathSeparator)
            .map(trimString)
            .filter(hasValue);
    }

    function createRefToPathHandler(name, path) {
        path.push(name);

        let params = [t.identifier(name)];
        let body = t.assignmentExpression("=", buildPathAST(path), t.identifier(name));
        let arrowFunction = t.arrowFunctionExpression(params, body);

        return t.jSXExpressionContainer(arrowFunction);
    }

    function buildPathAST(path) {
        return path
            .map(pathTokenToNode)
            .filter(hasValue)
            .reduce(nodeToExpression);
    }

    function pathTokenToNode(token) {
        if (token == "this")
            return t.thisExpression();

        if (identifierTester.test(token))
            return t.identifier(token);

        if (numericLiteralTester.test(token))
            return t.numericLiteral(+token);

        if (stringLiteralTester.test(token))
            return t.stringLiteral(literalToString(token));

        return null;
    }

    function nodeToExpression(expression, node) {
        let computed = t.isNumericLiteral(node) || t.isStringLiteral(node);

        return t.memberExpression(expression, node, computed);
    }

    function appendRefAttribute(path, elementName, options) {
        let refAttributeBuilderType = options.refType || defaultRefAttributeBuilderType;

        if (typeof refAttributeBuilder[refAttributeBuilderType] != "function") {
            console.error(errors.UNKNOWN_REFTYPE);
            refAttributeBuilderType = defaultRefAttributeBuilderType;
        }

        let attributeName = t.jSXIdentifier("ref");
        let attributeValue = refAttributeBuilder[refAttributeBuilderType](elementName, options);

        let attribute = t.jSXAttribute(attributeName, attributeValue);

        path.unshiftContainer("attributes", attribute);
    }

  return {
    inherits: require("babel-plugin-syntax-jsx"),

    visitor: {
        JSXNamespacedName(path, state) {
            let namespaceNode = path.get("namespace").node;
            let elementName = namespaceNode.name;
            let jsxOpeningElement = path.findParent(path => path.isJSXOpeningElement());

            appendRefAttribute(jsxOpeningElement, elementName, state.opts);

            let tagNode = path.get("name").node;
            let tagName = tagNode.name;

            path.replaceWith(t.jSXIdentifier(tagName));
        }
    }
  };
};