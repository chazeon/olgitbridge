/*
| Logs out a ol session.
*/
module.exports =
	async function( client, olServer )
{
	const res = await client.get( olServer + '/project' );
	const regexCSRF = /input name="_csrf" type="hidden" value="([^"]*)">/;
	let csrf = res.data.match( regexCSRF )[ 1 ];
	await client.post( olServer + '/logout', { '_csrf': csrf } );
};
