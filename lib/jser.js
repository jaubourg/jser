"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );
var instantiatorFactory = require( "./instantiatorFactory" );
var marker = require( "./marker" );

var slice = [].slice;

module.exports = function( getDefinition ) {
	var instantiate = instantiatorFactory( getDefinition );
	return {
		newInstance: function( name ) {
			var args = slice.call( arguments, 1 );
			return instantiate( name, "chain", function( instance, descriptor ) {
				return Attempt.join( descriptor.init.apply( instance,args ) ).chain( function() {
					return instance;
				} );
			} );
		},
		request: function( body ) {
			var objects = [];
			var serialized = [];
			var lastId = 0;
			function stringifyCallback( unused, value ) {
				if ( value instanceof instantiate.BaseClass ) {
					if ( value.hasOwnProperty( marker ) ) {
						value = value[ marker ];
					} else {
						var name = value.constructor[ marker ];
						var descriptor = instantiate.descriptors[ name ];
						var id = value[ marker ] = lastId++;
						objects.push( value );
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
				dataString = stringify( body );
			} catch ( e ) {
				console.log( e.stack );
				throw e; // IE7 :(
			} finally {
				_.forEach( objects, function( object ) {
					delete object[ marker ];
				} );
			}
			serialized.reverse();
			serialized.push( dataString );
			return "[" + serialized.join( "," ) + "]";
		}
	};
};
