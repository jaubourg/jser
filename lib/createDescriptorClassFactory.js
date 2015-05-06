"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );

function assignToObject( data ) {
	/* jshint validthis:true */
	_.assign( this.instance, data );
}

var descriptorPrototypeFields = {
	request: function( definition ) {
		return function( args ) {
			var self = this;
			return Attempt.join( definition.request.apply( definition, args ) ).chain( function( data ) {
				self.import( data );
				return self.instance;
			} );
		};
	},
	export: function( definition ) {
		return function() {
			return _.pick( this.instance, definition.export );
		};
	},
	update: function() {
		return assignToObject;
	},
	import: function() {
		return assignToObject;
	}
};

module.exports = function( Serializable, getDefinition ) {
	return function( name ) {
		function Instance() {}
		Instance.prototype = _.create( Serializable.prototype, {
			constructor: Instance
		} );
		function Descriptor( instance ) {
			this.instance = instance || new Instance();
		}
		Descriptor.prototype.name = Instance[ Serializable.marker ] = name;
		Descriptor.pending = Attempt.join( getDefinition( name ) ).success( function( definition ) {
			delete Descriptor.pending;
			_.assign( Instance.prototype, definition.proto );
			_.transform( descriptorPrototypeFields, function( proto, handler, methodName ) {
				proto[ methodName ] = handler( definition );
			}, Descriptor.prototype );
		} );
		return Descriptor;
	};
};
