"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );
var createCopyFunction = require( "./createCopyFunction" );
var marker = require( "./marker" );

var copyFunctionFields = {
	export: true,
	update: true,
	import: true
};

module.exports = function( getDefinition ) {
	function Serializable() {}
	var descriptors = {};
	function getDescriptor( name ) {
		function Constructor() {}
		Constructor.prototype = _.create( Serializable.prototype, {
			constructor: Constructor
		} );
		Constructor[ marker ] = name;
		var descriptor = {
			Constructor: Constructor,
			pending: Attempt.join( getDefinition( name ) ).success( function( definition ) {
				delete descriptor.pending;
				_.assign( Constructor.prototype, definition.proto );
				_.assign( descriptor, {
					init: definition.init
				}, _.mapValues( copyFunctionFields, function( unused, key ) {
					return createCopyFunction( definition[ key ] || [] );
				} ) );
			} )
		};
		return descriptor;
	}
	return _.assign( Serializable, {
		descriptors: descriptors,
		instantiate: function( name, type, handler, earlyHandler ) {
			var descriptor = descriptors[ name ] || ( descriptors[ name ] = getDescriptor( name ) );
			var instance = new descriptor.Constructor();
			if ( earlyHandler ) {
				earlyHandler( instance, descriptor );
			}
			return descriptor.pending ? descriptor.pending[ type ]( function() {
				return handler( instance, descriptor );
			} ) : handler( instance, descriptor );
		}
	} );
};
