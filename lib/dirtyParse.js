"use strict";

module.exports = function( string ) {
	/* jshint -W054 */
	return ( new Function( "return (" + string + ");" ) )();
};
