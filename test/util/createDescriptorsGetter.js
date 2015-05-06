"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );

var rDelay = /<([0-9]+)>$/;

module.exports = function( descriptors ) {
	var data = _.transform( descriptors, function( result, descriptor, name ) {
		var delay = false;
		name = name.replace( rDelay, function( _, delayString ) {
			delay = 1 * delayString;
			return "";
		} );
		result[ name ] = {
			descriptor: descriptor,
			delay: delay
		};
	} );
	return function( name ) {
		if ( !data.hasOwnProperty( name ) ) {
			return Attempt.createFailure( new Error( "unknown class " + name ) );
		}
		var info = data[ name ];
		if ( info.requested ) {
			return Attempt.createFailure( new Error( "class " + name + " was already requested" ) );
		}
		info.requested = true;
		return info.delay !== false ? Attempt( function( success ) {
			setTimeout( function() {
				success( info.descriptor );
			}, info.delay );
		} ) : info.descriptor;
	};
};
