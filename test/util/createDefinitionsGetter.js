"use strict";

module.exports = function( definitions ) {
	var alreadyRequested = {};
	return function( name ) {
		if ( !definitions.hasOwnProperty( name ) ) {
			throw "unknown class " + name;
		}
		if ( alreadyRequested.hasOwnProperty( name ) ) {
			throw "class " + name + " was already requested earlier";
		}
		return definitions[ name ];
	};
};
