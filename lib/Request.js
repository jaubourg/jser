"use strict";

var _ = require( "lodash" );

function Request( Serializable, data ) {
	var marker = Serializable.marker;
	var objects = [];
	var serialized = [];
	var lastId = 0;
	function stringifyCallback( unused, value ) {
		if ( value instanceof Serializable ) {
			if ( value.hasOwnProperty( marker ) ) {
				value = value[ marker ];
			} else {
				var name = value.constructor[ marker ];
				var descriptor = Serializable.descriptors[ name ];
				var id = value[ marker ] = lastId++;
				objects[ id ] = value;
				serialized[ id ] = stringify( [ name, descriptor.export( {}, value ) ] );
				value = id;
			}
		} else if ( typeof value === "number" ) {
			serialized[ lastId ] = JSON.stringify( value );
			value = lastId++;
		}
		return value;
	}
	function stringify( value ) {
		return JSON.stringify( value, stringifyCallback );
	}
	var dataString;
	try {
		dataString = stringify( data );
	} catch ( e ) {
		//console.log( e.stack );
		throw e; // IE7 :(
	} finally {
		_.forEach( objects, function( object ) {
			delete object[ marker ];
		} );
	}
	serialized.reverse();
	serialized.push( dataString );
	this._objects = objects;
	this._body = "[" + serialized.join( "," ) + "]";
}

Request.prototype = {
	getBody: function() {
		return this._body;
	}
};

module.exports = Request;
