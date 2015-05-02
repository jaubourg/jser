"use strict";

var Attempt = require( "attempt-js" );
var ArrayCollection = require( "./util/ArrayCollection" );
var copyFunctionFactory = require( "./util/copyFunctionFactory" );
var ObjectCollection = require( "./util/ObjectCollection" );

var slice = [].slice;

var copyFunctionField = {
	"request": true,
	"responseNew": true,
	"responseSync": true
};

module.exports = function( marker ) {
	var classDescriptors = new ArrayCollection();
	var classIdForName = {};
	return {
		register: function( options ) {
			function Constructor() {}
			new ObjectCollection( options.proto ).each( function( value, key ) {
				Constructor.prototype[ key ] = value;
			} );
			var classDescriptor = new ObjectCollection( options ).map( function( value, key ) {
				return copyFunctionField[ key ] ? copyFunctionFactory( value ) : value;
			} ).toObject();
			delete classDescriptor.proto;
			classDescriptor.Constructor = Constructor;
			classIdForName[ options.name ] = Constructor[ marker ] = classDescriptors.add( classDescriptor );
		},
		newInstance: function( name ) {
			var id = classIdForName[ name ];
			if ( !id ) {
				throw "unknown class " + name;
			}
			var classDescriptor = classDescriptors.get( id );
			var self = new classDescriptor.Constructor();
			return Attempt.join( classDescriptor.init.apply( self, slice.call( arguments, 1 ) ) ).chain( function() {
				return self;
			} );
		},
		request: function( body ) {
			var objects = new ArrayCollection();
			var serializedObjects = [];
			function stringifyCallback( _, object ) {
				if ( !( object instanceof Object ) ) {
					return object;
				}
				var classDescriptor = classDescriptors.get( object.constructor[ marker ] );
				if ( !classDescriptor ) {
					return object;
				}
				var id = object[ marker ];
				if ( !id ) {
					id = objects.add( object );
					object[ marker ] = id;
					var tmp = classDescriptor.request( {}, object );
					tmp[ marker ] = classDescriptor.name;
					serializedObjects[ id - 1 ] = stringify( tmp );
				}
				return marker + ( id - 1 );
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
				objects.each( function( object ) {
					delete object[ marker ];
				} );
			}
			return "{\"data\":" + dataString +
				",\"objects\":[" + serializedObjects.join( "," ) + "]}";
		}
	};
};
