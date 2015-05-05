"use strict";

var Attempt = require( "attempt-js" );
var createRequestClass = require( "./createRequestClass" );
var createSerializableClass = require( "./createSerializableClass" );

var slice = [].slice;

module.exports = function( getDefinition ) {
	var Serializable = createSerializableClass( getDefinition );
	var Request = createRequestClass( Serializable );
	return {
		newInstance: function( name ) {
			var args = slice.call( arguments, 1 );
			return Serializable.instantiate( name, "chain", function( instance, descriptor ) {
				return Attempt.join( descriptor.init.apply( instance,args ) ).chain( function() {
					return instance;
				} );
			} );
		},
		request: function( body ) {
			return new Request( body );
		}
	};
};
