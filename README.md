# babel-plugin-transform-jsx-namespace-to-ref

## Example

**In**

```javascript
class MyComponent extends React.Component {
  render() {
    return <myDiv:div />
  }
}
```

**Out**

```javascript
class MyComponent extends React.Component {
  render() {
    return <div ref={myDiv => this.myDiv = myDiv} />;
  }
}
```

## Installation

```sh
npm install --save-dev babel-plugin-transform-jsx-namespace-to-ref
```

## Usage

Examples for plugin options

### asThisProperty option

> The default option (not necessary)

To specify the path for element

**.babelrc**

```json
{
  "plugins": [[
    "babel-plugin-transform-jsx-namespace-to-ref", {
      "refType": "asThisProperty",
      "path": "property"
    }
  ]]
}
```

**In**

```javascript
class MyComponent extends React.Component {
  render() {
    return <myDiv:div />
  }
}
```

**Out**

```javascript
class MyComponent extends React.Component {
  render() {
    return <div ref={myDiv => this.property.myDiv = myDiv} />;
  }
}
```

### legacy option

**.babelrc**

```json
{
  "plugins": [[
    "babel-plugin-transform-jsx-namespace-to-ref", {
      "refType": "legacy"
    }
  ]]
}
```

**In**

```javascript
class MyComponent extends React.Component {
  render() {
    return <myDiv:div />
  }
}
```

**Out**

```javascript
class MyComponent extends React.Component {
  render() {
    return <div ref="myDiv" />;
  }
}
```
