"use strict";

module.exports = function( definitions ) {
	return function( name ) {
		if ( !definitions.hasOwnProperty( name ) ) {
			throw "unknown class " + name;
		}
		return definitions[ name ];
	};
};
