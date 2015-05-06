"use strict";

var _ = require( "lodash" );
var createDescriptorClassFactory = require( "./createDescriptorClassFactory" );

module.exports = function( getDefinition ) {
	function Serializable() {}
	var marker = Serializable.marker = "@@json@@";
	var descriptorClasses = {};
	var getDescriptorClass = createDescriptorClassFactory( Serializable, getDefinition );
	function getObjectName( object ) {
		var constructor = object && object.constructor;
		return constructor && constructor[ marker ] || false;
	}
	return _.assign( Serializable, {
		instantiate: function( name, type, handler, earlyHandler ) {
			var Descriptor = descriptorClasses[ name ] || ( descriptorClasses[ name ] = getDescriptorClass( name ) );
			var descriptor = new Descriptor();
			if ( earlyHandler ) {
				earlyHandler( descriptor );
			}
			return Descriptor.pending ? Descriptor.pending[ type ]( function() {
				return handler( descriptor );
			} ) : handler( descriptor );
		},
		getDescriptor: function( instance, callback ) {
			var name = getObjectName( instance );
			var Descriptor = name && descriptorClasses[ name ];
			if ( !Descriptor ) {
				throw new Error( "unable to find descriptor in memory" );
			}
			if ( Descriptor.pending ) {
				throw new Error( "descriptor is pending" );
			}
			var descriptor = new Descriptor( instance );
			if ( callback ) {
				callback( descriptor );
			}
			return descriptor;
		}
	} );
};
