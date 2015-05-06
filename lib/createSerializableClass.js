"use strict";

var _ = require( "lodash" );
var createHandlerClassFactory = require( "./createHandlerClassFactory" );

module.exports = function( getDescriptor ) {
	function Serializable() {}
	var marker = Serializable.marker = "@@json@@";
	var handlerClasses = {};
	var getHandlerClass = createHandlerClassFactory( Serializable, getDescriptor );
	function getObjectName( object ) {
		var constructor = object && object.constructor;
		return constructor && constructor[ marker ] || false;
	}
	return _.assign( Serializable, {
		instantiate: function( name, type, callback, earlyCallback ) {
			var Handler = handlerClasses[ name ] || ( handlerClasses[ name ] = getHandlerClass( name ) );
			var handler = new Handler();
			if ( earlyCallback ) {
				earlyCallback( handler );
			}
			return Handler.pending ? Handler.pending[ type ]( function() {
				return callback( handler );
			} ) : callback( handler );
		},
		getHandler: function( instance, callback ) {
			var name = getObjectName( instance );
			var Handler = name && handlerClasses[ name ];
			if ( !Handler ) {
				throw new Error( "unable to find handler class in memory" );
			}
			if ( Handler.pending ) {
				throw new Error( "handler class is pending" );
			}
			var handler = new Handler( instance );
			if ( callback ) {
				callback( handler );
			}
			return handler;
		}
	} );
};
