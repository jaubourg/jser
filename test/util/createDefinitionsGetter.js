"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );

var rDelay = /<([0-9]+)>$/;

module.exports = function( definitions ) {
	var data = _.transform( definitions, function( result, definition, name ) {
		var delay = false;
		name = name.replace( rDelay, function( _, delayString ) {
			delay = 1 * delayString;
			return "";
		} );
		result[ name ] = {
			definition: definition,
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
				success( info.definition );
			}, info.delay );
		} ) : info.definition;
	};
};
