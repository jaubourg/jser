"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );
var copyFunctionFactory = require( "./copyFunctionFactory" );

var slice = [].slice;

var copyFunctionFields = {
	"export": true,
	"update": true,
	"import": true
};

var marker = "@@jser@@";

module.exports = function() {
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
			var serialized = [];
			var lastId = 0;
			function stringifyCallback( unused, value ) {
				if ( value instanceof Serializable ) {
					if ( value.hasOwnProperty( marker ) ) {
						value = value[ marker ];
					} else {
						var name = value.constructor[ marker ];
						var descriptor = descriptors[ name ];
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
				//console.log( e.stack );
				throw e; // IE7 :(
			} finally {
				_.forEach( objects, function( object ) {
					delete object[ marker ];
				} );
			}
			serialized.reverse();
			serialized.push( dataString );
			return "[" + ( serialized.length - 1 ) + "," + serialized.join( "," ) + "]";
		}
	};
};
