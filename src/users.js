/*
| Manages user caching and semaphoring
| (one user can only have one session open at the time)
*/

// the users table
const Semaphore = require( './semaphore' );
const users = { };

const get =
	async function( email )
{
	let user = users[ email ];
	if( !user )
	{
		user = users[ email ] =
		{
			email: email,
			semaphore: new Semaphore( ),
		};
	}
	return await user.semaphore.request( );
};

const release =
	function( email, uflag )
{
	let user = users[ email ];
	user.semaphore.release( uflag );
};

module.exports =
{
	get: get,
	release: release,
};
