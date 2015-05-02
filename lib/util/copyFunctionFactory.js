"use strict";

var ArrayCollection = require( "./ArrayCollection" );

module.exports = function( fields ) {
	var code = "";
	new ArrayCollection( fields ).each( function( field ) {
		field = JSON.stringify( field );
		code += "dest[" + field + "]=src[" + field + "];";
	} );
	/* jshint -W054 */
	return new Function( "dest, src", code + "return dest;" );
};
