/*
| Deletes a doc, file or folder.
|
| ~client: axios client
| ~project_id: project id
| ~type: doc/file/folder
| ~entitity_id: entity id
*/
module.exports =
	async function( client, olServer, project_id, type, entity_id )
{
	switch( type )
	{
		case 'doc':
		case 'file':
		case 'folder':
			await client.delete(
				olServer + '/project/' + project_id + '/' + type + '/' + entity_id
			);
			return;
		default: throw new Error( );
	}
};
