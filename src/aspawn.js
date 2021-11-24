/*
| Async wrapper for child_process/spawn.
| Combines stdout and stderr into one string data.
*/
const spawn = require( 'child_process' ).spawn;

module.exports =
	function( cmd, args, opts )
{
	return new Promise( ( resolve, reject ) => {
		let str = '';
		const ch = spawn( cmd, args, opts );
		ch.stdout.on( 'data', ( data ) => str += data );
		ch.stderr.on( 'data', ( data ) => str += data );
		ch.on( 'close', ( code ) => code ? reject( str ) : resolve( str ) );
	} );
};
