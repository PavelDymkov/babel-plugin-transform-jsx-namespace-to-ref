const not = require("logical-not");


const defaultRefAttributeBuilderType = "asThisProperty";
const pathSeparator = /[.\[\]]/;
const identifierTester = /^[A-z$][\w$]*$/;
const stringLiteralTester = /^(["].*["])|(['].*['])$/;
const numericLiteralTester = /^\d+$/;
const errors = {
    UNKNOWN_REFTYPE: "unknown refType, using default",
    NO_METHOD: "method name is not defined, set up \"path\" parameter"
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
            let pathSource = createPathSourceStartsWithThis(options.path);
            let path = createPath(pathSource);

            path.push(elementName);

            let functionBody =
                t.assignmentExpression("=", buildPathAST(path), t.identifier(elementName));

            return createArrayFunction(elementName, functionBody);
        },

        asThisMethod(elementName, options) {
            let pathSource = createPathSourceStartsWithThis(options.path);
            let path = createPath(pathSource);

            if (path.length < 2) {
                throw new Error(errors.NO_METHOD);
            }

            let functionBody =
                t.callExpression(buildPathAST(path), [t.stringLiteral(elementName), t.identifier(elementName)]);

            return createArrayFunction(elementName, functionBody);
        },

        legacy(elementName) {
            return t.stringLiteral(elementName);
        }
    };

    function createPathSourceStartsWithThis(source) {
        source = trimString(source);

        if (not(source)) return "this";

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

    function createArrayFunction(paramName, body) {
        let params = [t.identifier(paramName)];
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

    function replaceClosingElement(path, identifier) {
        let closingElement = t.jSXClosingElement(identifier);

        path.replaceWith(closingElement);
    }

    return {
        inherits: require("babel-plugin-syntax-jsx"),

        visitor: {
            JSXNamespacedName(path, state) {
                let namespaceNode = path.get("namespace").node;
                let elementName = namespaceNode.name;

                let jsxElement = path.findParent(path => path.isJSXElement());
                let jsxOpeningElement = jsxElement.get("openingElement");
                let jsxClosingElement = jsxElement.get("closingElement");

                appendRefAttribute(jsxOpeningElement, elementName, state.opts);

                let tagNode = path.get("name").node;
                let tagName = tagNode.name;

                let tagIdentifier = t.jSXIdentifier(tagName);

                replaceClosingElement(jsxClosingElement, tagIdentifier);

                path.replaceWith(tagIdentifier);
            }
        }
    };
};
