/*
| Makes the real-time operations to join a project
| using socket io.
*/
const io = require( '../../lib/socket.io-client/lib/io' );

module.exports =
	async function( client, olServer, project_id )
{
	console.log( client.count, 'io connect to', project_id );
	const cookieJar = client.defaults.jar;
	const cookie = cookieJar.getCookieStringSync( olServer );
	const socket = io.connect(
			olServer,
			{
				withCredentials: true,
				cookie: cookie,
				transports: [ 'websocket' ],
				'force new connection': true,
			}
		);
	// FIXME handle issues a bit better
	socket.on( 'error', ( err ) => console.log( client.count, 'socketio error', err ) );
	socket.on( 'connect_error', ( ) => console.log( client.count, 'socketio connect error' ) );
	// waits for connection
	await new Promise( (resolve, reject) => socket.once( 'connect', ( ) => resolve() ) );
	const project =
		await new Promise( ( resolve, reject ) =>
			socket.emit(
				'joinProject',
				{ 'project_id': project_id },
				( self, res, owner, number ) => resolve( res )
			)
		);
	socket.disconnect( );
	return project;
};
