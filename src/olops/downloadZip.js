/*
| Downloads a project as a zip file.
*/
module.exports =
	async function( client, olServer, project_id )
{
	const res = await client.get(
		olServer + '/Project/' + project_id + '/download/zip',
		{ responseType: 'arraybuffer' }
	);
	return res.data;
};
