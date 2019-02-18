const babel = require("babel-core");
const transformJsxNamespaceToRef = require("../");
const isEquil = require("babel-plugin-test-helper")(transformJsxNamespaceToRef);
const { assert } = require("chai");


describe("transform-jsx-namespace-to-ref tests", () => {
    const defaultInput = `
        class Test extends React.Component {
            render() {
                return <name:Component />
            }
        }
    `;

    describe("default behavior", () => {
        it("should check default options", () => {
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output));
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

            assert.isTrue(isEquil(input, output));
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

            assert.isTrue(isEquil(input, output));
        });
    });

    describe("asThisProperty", () => {
        it("should check empty path", () => {
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, { path: "" }));
        });

        it("should check \"this\" in path", () => {
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, { path: "this" }));
        });

        it("should check simple path", () => {
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this.some.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, { path: "some" }));
        });

        it("should check path with numeric literal", () => {
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this[1].some.name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, { path: "[1].some" }));
        });

        it("should check path with string literal", () => {
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this["some"].name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, { path: "['some']" }));
        });

        it("should check \"this\" in path and double quotes string literal", () => {
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this["some"].name = name} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, { path: 'this["some"]' }));
        });
    });

    describe("asThisMethod", () => {
        it("should check \"asThisMethod\" refType", () => {
            let output = `
                class Test extends React.Component {
                    render() {
                        return <Component ref={name => this.method("name", name)} />;
                    }
                }
            `;

            assert.isTrue(isEquil(defaultInput, output, { refType: "asThisMethod", path: "method" }));
        });

        it("should throw an exception", () => {
            function execute() {
                babel.transform(defaultInput, {
                    plugins: [[transformJsxNamespaceToRef, { refType: "asThisMethod", path: "" }]],
                });
            }

            assert.throw(execute, Error);
        });
    });

    describe("legacy", () => {
        it("should check legacy refType", () => {
            let input = `<name:Component />`;
            let output = `<Component ref="name" />;`;

            assert.isTrue(isEquil(input, output, { refType: "legacy" }));
        });
    });
});
