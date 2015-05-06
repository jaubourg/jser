"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );

function assignToObject( data ) {
	/* jshint validthis:true */
	_.assign( this.instance, data );
}

var handlerPrototypeFields = {
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

function thrower( error ) {
	throw error;
}

module.exports = function( getDescriptor ) {
	var marker = "@@json@@";
	var tagMarker = marker + "id";
	function Serializable( name ) {
		this[ marker ] = name;
	}
	function getHandlerClass( name ) {
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
			_.transform( handlerPrototypeFields, function( proto, methodFactory, methodName ) {
				proto[ methodName ] = methodFactory( descriptor );
			}, Handler.prototype );
		} );
		return Handler;
	}
	var handlerClasses = {};
	return {
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
		getHandler: function( instance, callback, errorCallback ) {
			errorCallback = errorCallback || thrower;
			if ( !( instance instanceof Serializable ) ) {
				return errorCallback( new Error( "instance is not serializable" ) );
			}
			var name = instance[ marker ];
			var Handler = name && handlerClasses[ name ];
			if ( !Handler ) {
				return errorCallback( new Error( "unable to find handler class in memory" ) );
			}
			if ( Handler.pending ) {
				return errorCallback( new Error( "handler class is pending" ) );
			}
			var handler = new Handler( instance );
			if ( callback ) {
				callback( handler );
			}
			return handler;
		}
	};
};
