/*
| Gets the project page
| and more importantly sets the csrf token.
*/
module.exports =
	async function( client, olServer, project_id )
{
	if( !project_id ) project_id = '';
	const res = await client.get( olServer + '/project/' );
	const regexMETA = /<meta name="ol-csrfToken" content="([^"]*)"/;
	const csrf = res.data.match( regexMETA )[ 1 ];
	client.defaults.headers.common[ 'x-csrf-token' ] = csrf;
};
