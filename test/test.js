const babel = require("babel-core");
const {assert} = require("chai");

const spaces = /\s+/g;

function isEquil(input, expected, options) {
    let output = babel.transform(input, options).code;

    return output.replace(spaces, "") == expected.replace(spaces, "");
}


describe("transform-jsx-namespace-to-ref tests", () => {
    const defaultInput = `
        class Test extends React.Component {
            render() {
                return <name:Component />
            }
        }
    `;

    describe("default behavior", () => {
        let options = {
            plugins: ["transform-jsx-namespace-to-ref"]
        };

        it("should check default options", () => {
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, options));
        });

        it("should check transpiling jSXClosingElement", () => {
            let input = `
                class Test extends React.Component {
                    render() {
                        return <name:div>
                            some text
                        </name:div>
                    }
                }
            `;
            let output = `
                class Test extends React.Component {
                    render() {
                        return <div ref={name => this.name = name}>
                            some text
                        </div>;
                    }
                }
            `;

            assert.isTrue(isEquil(input, output, options));
        });

        it("should check JSX MemberExpression", () => {
            let input = `
                class Test extends React.Component {
                    render() {
                        return <name:Component.Member />
                    }
                }
            `;
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component.Member ref={name => this.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(input, output, options));
        });
    });

    describe("asThisProperty", () => {
        let params = {};
        let options = {
            plugins: [["transform-jsx-namespace-to-ref", params]]
        };

        it("should check empty path", () => {
            params.path = "";

            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, options));
        });

        it("should check \"this\" in path", () => {
            params.path = "this";

            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, options));
        });

        it("should check simple path", () => {
            params.path = "some";

            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this.some.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, options));
        });

        it("should check path with numeric literal", () => {
            params.path = "[1].some";

            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this[1].some.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, options));
        });

        it("should check path with string literal", () => {
            params.path = "['some']";

            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this["some"].name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, options));
        });

        it("should check \"this\" in path and double quotes string literal", () => {
            params.path = 'this["some"]';

            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this["some"].name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, options));
        });
    });

    describe("legacy", () => {
        let options = {
            plugins: [["transform-jsx-namespace-to-ref", { refType: "legacy" }]]
        };

        it("should check legacy refType", () => {
            let input = `<name:Component />`;
            let output = `<Component ref="name" />;`;

            assert.isTrue(isEquil(input, output, options));
        });
    });
});
