/*
| Uploads an entity (doc or file) to ol server.
*/
module.exports =
	async function( client, olServer, project_id, folder_id, name )
{
	const res = await client.post(
		olServer + '/project/' + project_id + '/folder',
		{ parent_folder_id: folder_id, name: name }
	);
	return res;
};
