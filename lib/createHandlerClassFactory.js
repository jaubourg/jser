"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );

function assignToObject( data ) {
	/* jshint validthis:true */
	_.assign( this.instance, data );
}

var prototypeFields = {
	request: function( descriptor ) {
		return function( args ) {
			var self = this;
			return Attempt.join( descriptor.request.apply( descriptor, args ) ).chain( function( data ) {
				self.import( data );
				return self.instance;
			} );
		};
	},
	export: function( descriptor ) {
		return function() {
			return _.pick( this.instance, descriptor.export );
		};
	},
	update: function() {
		return assignToObject;
	},
	import: function() {
		return assignToObject;
	}
};

module.exports = function( Serializable, getDescriptor ) {
	var tagMarker = Serializable.marker + "id";
	return function( name ) {
		function Instance() {}
		Instance.prototype = new Serializable( name );
		function Handler( instance ) {
			this.instance = instance || new Instance();
		}
		_.assign( Handler.prototype, {
			name: name,
			tag: function( id, callback ) {
				if ( this.instance.hasOwnProperty( tagMarker ) ) {
					return this.instance[ tagMarker ];
				}
				callback( ( this.instance[ tagMarker ] = id ) );
				return id;
			},
			untag: function() {
				delete this.instance[ tagMarker ];
			}
		} );
		Handler.pending = Attempt.join( getDescriptor( name ) ).success( function( descriptor ) {
			delete Handler.pending;
			_.assign( Instance.prototype, descriptor.proto );
			_.transform( prototypeFields, function( proto, methodFactory, methodName ) {
				proto[ methodName ] = methodFactory( descriptor );
			}, Handler.prototype );
		} );
		return Handler;
	};
};
