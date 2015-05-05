"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );
var copyFunctionFactory = require( "./copyFunctionFactory" );
var marker = require( "./marker" );

var copyFunctionFields = {
	export: true,
	update: true,
	import: true
};

module.exports = function( getDefinition ) {
	function BaseClass() {}
	var descriptors = {};
	function getDescriptor( name ) {
		function Constructor() {}
		Constructor.prototype = _.create( BaseClass.prototype, {
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
					return copyFunctionFactory( definition[ key ] || [] );
				} ) );
			} )
		};
		return descriptor;
	}
	function instantiate( name, type, handler, earlyHandler ) {
		var descriptor = descriptors[ name ] || ( descriptors[ name ] = getDescriptor( name ) );
		var instance = new descriptor.Constructor();
		if ( earlyHandler ) {
			earlyHandler( instance, descriptor );
		}
		if ( descriptor.pending ) {
			return descriptor.pending[ type ]( function() {
				return handler( instance, descriptor );
			} );
		}
		return handler( instance, descriptor );
	}
	instantiate.BaseClass = BaseClass;
	instantiate.descriptors = descriptors;
	return instantiate;
};
