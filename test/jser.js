"use strict";

var Attempt = require( "attempt-js" );

var jser = require( "../lib/jser" );

module.exports = {
	"no registered class": function( __ ) {
		__.expect( 1 );
		var serializer = jser( "@@jser@@" );
		var object = {
			"hello": "world"
		};
		var output = JSON.parse( serializer.request( object ) );
		__.deepEqual( output, [
			[],
			object
		], "no special treatment" );
		__.done();
	},
	"registered class": function( __ ) {
		__.expect( 1 );
		var serializer = jser( "@@jser@@" );
		serializer.register( {
			name: "MyClass",
			init: function( preString, flag ) {
				this.string = preString + " world";
				this.num = 666;
				this.boolean = flag || false;
			},
			proto: {},
			request: [ "boolean", "string" ]
		} );
		serializer.newInstance( "MyClass", "hello", 12 ).success( function( object ) {
			var output = JSON.parse( serializer.request( object ) );
			__.deepEqual( output, [
				[ {
					"@@jser@@": "MyClass",
					string: "hello world",
					boolean: 12
				} ],
				"@@jser@@0"
			], "single object properly serialized" );
		} ).always( function() {
			__.done();
		} );
	},
	"object within an object": function( __ ) {
		__.expect( 1 );
		var serializer = jser( "@@jser@@" );
		serializer.register( {
			name: "MyClass",
			init: function( preString, flag ) {
				this.string = preString + " world";
				this.num = 666;
				this.boolean = flag || false;
			},
			proto: {},
			request: [ "boolean", "string" ]
		} );
		Attempt.join(
			serializer.newInstance( "MyClass", "hello", 12 ),
			serializer.newInstance( "MyClass", "bad" )
		).success( function( object, child ) {
			object.boolean = [ "a", child ];
			var output = JSON.parse( serializer.request( object ) );
			__.deepEqual( output, [
				[ {
					"@@jser@@": "MyClass",
					string: "hello world",
					boolean: [ "a", "@@jser@@1" ]
				}, {
					"@@jser@@": "MyClass",
					string: "bad world",
					boolean: false
				} ],
				"@@jser@@0"
			], "object within an object properly serialized" );
		} ).always( function() {
			__.done();
		} );
	},
	"recursive structure":  function( __ ) {
		__.expect( 1 );
		var serializer = jser( "@@jser@@" );
		serializer.register( {
			name: "MyClass",
			init: function( preString, flag ) {
				this.string = preString + " world";
				this.num = 666;
				this.boolean = flag || false;
			},
			proto: {},
			request: [ "boolean", "string" ]
		} );
		serializer.newInstance( "MyClass", "hello", 12 ).success( function( object ) {
				object.boolean = [ "a", object ];
				var output = JSON.parse( serializer.request( object ) );
				__.deepEqual( output, [
					[ {
						"@@jser@@": "MyClass",
						string: "hello world",
						boolean: [ "a", "@@jser@@0" ]
					} ],
					"@@jser@@0"
				], "recursive structures properly serialized" );
			} ).always( function() {
				__.done();
			} );
	}
};
