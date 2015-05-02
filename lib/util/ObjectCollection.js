"use strict";

function ObjectCollection( initial ) {
	this._object = initial || {};
}

ObjectCollection.prototype = {
	add: function( key, element ) {
		this._object[ key ] = element;
		return key;
	},
	get: function( key ) {
		return this._object[ key ];
	},
	empty: function() {
		this._object = {};
		return this;
	},
	each: function( callback ) {
		for ( var key in this._object ) {
			if ( this._object.hasOwnProperty( key ) ) {
				callback( this._object[ key ], key, this );
			}
		}
		return this;
	},
	map: function( callback ) {
		var output = {};
		for ( var key in this._object ) {
			if ( this._object.hasOwnProperty( key ) ) {
				output[ key ] = callback( this._object[ key ], key, this );
			}
		}
		return new ObjectCollection( output );
	},
	toJSON: function() {
		return JSON.stringify( this._object );
	},
	toObject: function() {
		return this._object;
	}
};

module.exports = ObjectCollection;
