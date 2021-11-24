/*
| Uploads an entity (doc or file) to ol server.
*/
const FormData = require( 'form-data' );

module.exports =
	async function( client, olServer, project_id, folder_id, filename, data )
{
	const formData = new FormData();
	formData.append( 'qqfile', data, filename );
	try
	{
		await client.post(
			olServer + '/project/' + project_id + '/upload?folder_id=' + folder_id,
			formData,
			{ headers: formData.getHeaders( ) }
		);
	}
	catch( e )
	{
		throw new Error( e.response.status + ' ' + e.response.statusText );
	}
};
