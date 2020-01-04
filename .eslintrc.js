module.exports = {
  parser: 'babel-eslint',
  extends: [
    '@tophat/eslint-config/base',
    '@tophat/eslint-config/jest',
    '@tophat/eslint-config/web'
  ],
  parserOptions: {
    "sourceType": "module"
  }
}
