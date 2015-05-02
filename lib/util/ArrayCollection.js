"use strict";

function ArrayCollection( initial ) {
	this._array = initial || [];
}

ArrayCollection.prototype = {
	add: function( element ) {
		this._array.push( element );
		return this._array.length;
	},
	get: function( id ) {
		return this._array[ id - 1 ];
	},
	empty: function() {
		this._array = [];
		return this;
	},
	each: function( callback ) {
		var i = 0;
		var length = this._array.length;
		for ( ; i < length; i++ ) {
			callback( this._array[ i ], i + 1, this );
		}
		return this;
	},
	map: function( callback ) {
		var i = 0;
		var length = this._array.length;
		var output = new Array( length );
		for ( ; i < length; i++ ) {
			output[ i ] = callback( this._element[ i ], i + 1, this );
		}
		return new ArrayCollection( output );
	},
	toJSON: function() {
		return JSON.stringify( this._array );
	},
	toArray: function() {
		return this._array;
	}
};

module.exports = ArrayCollection;
