"use strict";

var createManager = require( "./createManager" );
var createRequestClass = require( "./createRequestClass" );

var slice = [].slice;

module.exports = function( getDescriptor ) {
	var manager = createManager( getDescriptor );
	var Request = createRequestClass( manager );
	return {
		newInstance: function( name ) {
			var args = slice.call( arguments, 1 );
			return manager.instantiate( name, "chain", function( handler ) {
				return handler.request( args );
			} );
		},
		request: function( body ) {
			return new Request( body );
		}
	};
};
