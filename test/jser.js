"use strict";

var Attempt = require( "attempt-js" );

var jser = require( "../lib/jser" );

module.exports = {
	"no registered class": function( __ ) {
		__.expect( 1 );
		var serializer = jser();
		var object = {
			"hello": "world"
		};
		var output = JSON.parse( serializer.request( object ) );
		__.deepEqual( output, [
			0,
			object
		], "no special treatment" );
		__.done();
	},
	"registered class": function( __ ) {
		__.expect( 1 );
		var serializer = jser();
		serializer.register( {
			name: "MyClass",
			init: function( preString, flag ) {
				this.string = preString + " world";
				this.num = 666;
				this.boolean = flag || false;
			},
			proto: {},
			export: [ "boolean", "string" ]
		} );
		serializer.newInstance( "MyClass", "hello", 12 ).success( function( object ) {
			var output = JSON.parse( serializer.request( object ) );
			__.deepEqual( output, [
				2,
				12,
				[
					"MyClass",
					{
						string: "hello world",
						boolean: 1
					}
				],
				0
			], "single object properly serialized" );
		} ).always( function() {
			__.done();
		} );
	},
	"object within an object": function( __ ) {
		__.expect( 1 );
		var serializer = jser();
		serializer.register( {
			name: "MyClass",
			init: function( preString, flag ) {
				this.string = preString + " world";
				this.num = 666;
				this.boolean = flag || false;
			},
			proto: {},
			export: [ "boolean", "string" ]
		} );
		Attempt.join(
			serializer.newInstance( "MyClass", "hello", 12 ),
			serializer.newInstance( "MyClass", "bad" )
		).success( function( object, child ) {
			object.boolean = [ "a", child ];
			var output = JSON.parse( serializer.request( object ) );
			__.deepEqual( output, [
				2,
				[
					"MyClass",
					{
						string: "bad world",
						boolean: false
					}
				],
				[
					"MyClass",
					{
						string: "hello world",
						boolean: [ "a", 1 ]
					}
				],
				0
			], "object within an object properly serialized" );
		} ).always( function() {
			__.done();
		} );
	},
	"recursive structure":  function( __ ) {
		__.expect( 1 );
		var serializer = jser();
		serializer.register( {
			name: "MyClass",
			init: function( preString, flag ) {
				this.string = preString + " world";
				this.num = 666;
				this.boolean = flag || false;
			},
			proto: {},
			export: [ "boolean", "string" ]
		} );
		serializer.newInstance( "MyClass", "hello", 12 ).success( function( object ) {
				object.boolean = [ "a", object ];
				var output = JSON.parse( serializer.request( object ) );
				__.deepEqual( output, [
					1,
					[
						"MyClass",
						{
							string: "hello world",
							boolean: [ "a", 0 ]
						}
					],
					0
				], "recursive structures properly serialized" );
			} ).always( function() {
				__.done();
			} );
	}
};
