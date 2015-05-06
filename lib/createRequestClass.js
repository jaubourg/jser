"use strict";

var _ = require( "lodash" );
var Attempt = require( "attempt-js" );
var dirtyParse = require( "./dirtyParse" );

module.exports = function( Serializable ) {
	function Request( data ) {
		var instances = [];
		var serialized = [];
		var nextIndex = 0;
		function stringifyCallback( unused, value ) {
			if ( value instanceof Serializable ) {
				Serializable.getHandler( value, function( handler ) {
					value = handler.tag( nextIndex, function( index ) {
						nextIndex++;
						instances[ index ] = handler;
						serialized[ index ] = stringify( [ handler.name, handler.export() ] );
					} );
				} );
			} else if ( typeof value === "number" ) {
				serialized[ nextIndex ] = JSON.stringify( value );
				value = nextIndex++;
			}
			return value;
		}
		function stringify( value ) {
			return JSON.stringify( value, stringifyCallback );
		}
		var dataString;
		try {
			dataString = stringify( data );
		} finally {
			_.forEach( instances, function( handler, index ) {
				handler.untag();
				instances[ index ] = handler.instance;
			} );
		}
		serialized.reverse();
		serialized.push( dataString );
		this._objects = instances;
		this._body = "[" + serialized.join( "," ) + "]";
	}

	Request.prototype = {
		getBody: function() {
			return this._body;
		},
		handleResponse: function( responseString, extractCallback ) {
			var array = dirtyParse( responseString );
			if ( extractCallback ) {
				array = extractCallback( array );
			}
			var response = array.pop();
			var lastIndex = array.length - 1;
			var pendingHandlers = [];
			function evaluateElement( element, key ) {
				/* jshint validthis:true */
				this[ key ] = evaluate( element );
			}
			function evaluate( data ) {
				if ( data instanceof Array ) {
					_.forEach( data, evaluateElement );
				} else {
					var type = typeof data;
					if ( type === "object" ) {
						_.forOwn( data, evaluateElement );
					} else if ( type === "number" ) {
						data = array[ lastIndex - data ];
					}
				}
				return data;
			}
			_.forEach( array, function( element, index ) {
				if ( element instanceof Array ) {
					var type = element[ 0 ];
					var value = element[ 1 ];
					if ( typeof type === "number" ) {
						var target = array[ index ] = this._objects[ value ];
						Serializable.getHandler( target ).update( evaluate( value ) );
					} else {
						var pending = Serializable.instantiate( type, "success", function( handler ) {
							handler.update( value );
						}, function( handler ) {
							array[ index ] = handler.instance;
							value = evaluate( value );
						} );
						if ( pending ) {
							pendingHandlers.push( pending );
						}
					}
				}
			} );
			response = evaluate( response );
			return pendingHandlers.length ? Attempt.joinArray( pendingHandlers ).chain( function() {
				return response;
			} ) : Attempt.createSuccess( response );
		}
	};

	return Request;
};
