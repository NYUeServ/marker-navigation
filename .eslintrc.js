module.exports = 
{
  // http://eslint.org/docs/rules/
  "extends": [
  	"eslint:recommended",
  	"google"
 	],

	"parserOptions": {
		"ecmaVersion": 6
	},

	"rules": {
		"padded-blocks": 0,
		"no-trailing-spaces": 0,
		"brace-style": 0,
		"object-curly-spacing": 0,
		"linebreak-style": 0,
		"valid-jsdoc": 0,
		"block-spacing": 0,
		"max-len": [
			1,
			100
		]
	},

	"env": {
		"node": true,
		"browser": true
	}
}