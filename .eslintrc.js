module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': 'standard',
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'block-spacing': ["error", "never"],
    'brace-style': ["error", "stroustrup", {"allowSingleLine": true}],
    'object-curly-spacing': ['error', 'never'],
    'space-before-function-paren': ["error", {"anonymous": "never", "named": "never", "asyncArrow": "always"}]
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
