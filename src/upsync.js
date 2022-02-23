/*
| Syncronizes a local version into overleaf.
*/
const fs = require( 'fs/promises' );
const olops = require( './olops' );

// for debugging set to true to not really change overleaf
const dry = false;

/*
| Adds a folder.
|
| ~returns: folder id
*/
const addFolder =
	async function( client, olServer, project, branch, relDir, name )
{
	console.log( client.count, 'adding folder ./' + relDir + name );
	if( dry ) return 'X';
	try
	{
		const reply = await olops.addFolder( client, olServer, project.id, branch.id, name );
		return reply.data._id;
	}
	catch( e )
	{
		const response = e.response;
		if( response && response.data === 'file already exists' ) return 'EXISTS';
		// rethrow other errors
		throw e;
	}
};

/*
| Uploads an entity.
*/
const upload =
	async function( client, olServer, project, relDir, branch, name, data )
{
	console.log( client.count, 'uploading ./' + relDir + name );
	if( dry ) return;
	await olops.upload( client, olServer, project.id, branch.id, name, data );
};

/*
| Removes an entity.
*/
const remove =
	async function( client, olServer, project, relDir, leaf )
{
	console.log( client.count, 'removing ' + leaf.type + ' ./' + relDir + leaf.name );
	if( dry ) return;
	await olops.remove( client, olServer, project.id, leaf.type, leaf.id );
};

/*
| Compares the pad with the blueprint and uploads all changes to overleaf.
|
| ~project: project object holding all kind of data.
| ~olServer: URL to overleaf server
| ~relDir: relative dir in the project
| ~branch: overleaf folder branch info
*/
const upSyncDir =
	async function( client, olServer, project, relDir, branch )
{
	console.log( client.count, 'upsyncing ./' + relDir );
	const padDir = project.padDir + relDir;
	const blueDir = project.blueDir + relDir;
	let list = await fs.readdir( padDir, { withFileTypes: true } );
	for( let entry of list )
	{
		const name = entry.name;
		// ignores .git
		if( name === '.git' ) continue;
		let leaf = branch.subs[ name ];
		if( entry.isDirectory( ) )
		{
			// create the folder if not there
			if( !leaf )
			{
				const id = await addFolder( client, olServer, project, branch, relDir, name );
				leaf = branch.subs[ name ] =
				{
					id: id,
					name: name,
					branch: branch,
					subs: { },
				};
			}
			await upSyncDir( client, olServer, project, relDir + '/' + name + '/', leaf );
		}
		else
		{
			let blueData;
			let padData = await fs.readFile( padDir + name );
			try{ blueData = await fs.readFile( blueDir + name ); }
			catch( e )
			{
				// rethrows anything but entity not found
				if( e.code !== 'ENOENT' ) throw e;
				await upload( client, olServer, project, relDir, branch, name, padData );
				continue;
			}
			if( padData.compare( blueData ) )
			{
				// files not equal
				await upload( client, olServer, project, relDir, branch, name, padData );
			}
		}
	}

	// removes entries from overleaf in project tree that are no longer in pad
	const subs = branch.subs;
	for( let key in subs )
	{
		const leaf = subs[ key ];
		const name = leaf.name;
		try
		{
			await fs.stat( padDir + name );
			// if the above line throws no error (entry is there), nothing to remove
			continue;
		}
		catch( e )
		{
			// rethrows all but entity not found
			if( e.code !== 'ENOENT' ) throw e;
		}
		await remove( client, olServer, project, relDir, leaf );
	}
};

/*
| Compares the pad with the blueprint and uploads all changes to overleaf.
*/
module.exports =
	async function( client, olServer, project )
{
	console.log( client.count, 'overleaf joining project' );
	project.info = await olops.joinProject( client, olServer, project.id );
	project.tree = await olops.buildTree( project.info.rootFolder[ 0 ] );
	await upSyncDir( client, olServer, project, '', project.tree );
};
