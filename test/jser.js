"use strict";

var createDefinitionsGetter = require( "./util/createDefinitionsGetter" );

var jser = require( "../lib/jser" );

var getMyClass = createDefinitionsGetter( {
	MyClass: {
		init: function( preString, flag ) {
			this.string = preString + " world";
			this.num = 666;
			this.boolean = flag || false;
		},
		proto: {},
		export: [ "boolean", "string" ]
	}
} );

module.exports = {
	"no registered class": function( __ ) {
		__.expect( 1 );
		var serializer = jser( getMyClass );
		var object = {
			"hello": "world"
		};
		var output = JSON.parse( serializer.request( object ).getBody() );
		__.deepEqual( output, [
			object
		], "no special treatment" );
		__.done();
	},
	"exception are propagated": function( __ ) {
		__.expect( 1 );
		function ErrorThrower() {}
		ErrorThrower.prototype.toJSON = function() {
			throw "PROPAGATED";
		};
		var serializer = jser( getMyClass );
		__.throws( function() {
			serializer.request( new ErrorThrower() );
		}, /^PROPAGATED$/, "exception was propagated" );
		__.done();
	},
	"registered class": function( __ ) {
		__.expect( 1 );
		var serializer = jser( getMyClass );
		serializer.newInstance( "MyClass", "hello", 12 ).success( function( object ) {
			var output = JSON.parse( serializer.request( object ).getBody() );
			__.deepEqual( output, [
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
		var serializer = jser( getMyClass );
		serializer.newInstance( "MyClass", "hello", 12 ).success( function( object ) {
			serializer.newInstance( "MyClass", "bad" ).success( function( child ) {
				object.boolean = [ "a", child ];
				var output = JSON.parse( serializer.request( object ).getBody() );
				__.deepEqual( output, [
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
		} );
	},
	"recursive structure":  function( __ ) {
		__.expect( 1 );
		var serializer = jser( getMyClass );
		serializer.newInstance( "MyClass", "hello", 12 ).success( function( object ) {
				object.boolean = [ "a", object ];
				var output = JSON.parse( serializer.request( object ).getBody() );
				__.deepEqual( output, [
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
