"use strict";

var _ = require( "lodash" );

module.exports = function( fields ) {
	/* jshint -W054 */
	return new Function( "dest, src", _.map( fields, function( name ) {
		name = JSON.stringify( name );
		return "dest[" + name + "]=src[" + name + "];";
	} ).join( ";" ) + "return dest;" );
};
