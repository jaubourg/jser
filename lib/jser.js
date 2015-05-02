"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );
var copyFunctionFactory = require( "./copyFunctionFactory" );

var slice = [].slice;

var copyFunctionFields = {
	"request": true,
	"responseNew": true,
	"responseSync": true
};

module.exports = function( marker ) {
	function Serializable() {}
	var descriptors = {};
	return {
		register: function( options ) {
			function Constructor() {}
			_.assign( ( Constructor.prototype = _.create( Serializable.prototype ) ), options.proto, {
				constructor: Constructor
			} );
			descriptors[ ( Constructor[ marker ] = options.name ) ] = _.assign( {
				Constructor: Constructor,
				init: options.init
			}, _.mapValues( copyFunctionFields, function( unused, key ) {
				return copyFunctionFactory( options[ key ] || [] );
			} ) );
		},
		newInstance: function( name ) {
			var descriptor = descriptors.hasOwnProperty( name ) && descriptors[ name ];
			if ( !descriptor ) {
				throw "jser: unknown class " + JSON.stringify( name );
			}
			var self = new descriptor.Constructor();
			return Attempt.join( descriptor.init.apply( self, slice.call( arguments, 1 ) ) ).chain( function() {
				return self;
			} );
		},
		request: function( body ) {
			var objects = [];
			var serializedObjects = [];
			function stringifyCallback( unused, value ) {
				if ( value instanceof Serializable ) {
					var id = value[ marker ];
					if ( id ) {
						id--;
					} else {
						var name = value.constructor[ marker ];
						var descriptor = descriptors[ name ];
						id = objects.length;
						objects.push( value );
						value[ marker ] = id + 1;
						serializedObjects[ id ] = stringify( [ name, descriptor.request( {}, value ) ] );
					}
					return "@@jser@@" + id;
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
				throw e; // IE7 :(
			} finally {
				_.forEach( objects, function( object ) {
					delete object[ marker ];
				} );
			}
			return "[[" + serializedObjects.join( "," ) + "]," + dataString + "]";
		}
	};
};
