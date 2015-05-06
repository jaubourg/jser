"use strict";

var createSerializableClass = require( "./createSerializableClass" );
var createRequestClass = require( "./createRequestClass" );

var slice = [].slice;

module.exports = function( getDescriptor ) {
	var Serializable = createSerializableClass( getDescriptor );
	var Request = createRequestClass( Serializable );
	return {
		newInstance: function( name ) {
			var args = slice.call( arguments, 1 );
			return Serializable.instantiate( name, "chain", function( handler ) {
				return handler.request( args );
			} );
		},
		request: function( body ) {
			return new Request( body );
		}
	};
};
