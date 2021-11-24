/*
| Syncronizes the overleaf version into the pad and blueprint directory.
*/
const fs = require( 'fs/promises' );
const olops = require( './olops' );
const unzipper = require( 'unzipper' );

/*
| Recurservly removes all but the .git directory
|
| ~dir: directory to clean
| ~keepGit: if true keeps the .git directory (in root dir only)
*/
const emptyDir =
	async function( dir, keepGit )
{
	const d = await fs.readdir( dir, { withFileTypes: true } );
	for( let entry of d )
	{
		let name = entry.name;
		if( keepGit && name === '.git' ) continue;
		await fs.rm( dir + name, { recursive: true } );
	}
};

/*
| Syncronizes the overleaf version into the pad and blueprint directory.
|
| ~client: axios client handle
| ~project: project handle
*/
module.exports =
	async function( client, olServer, project )
{
	const padDir = project.padDir;
	const blueDir = project.blueDir;

	console.log( client.count, 'emptying pad & blue' );
	await emptyDir( padDir, true );
	await emptyDir( blueDir, false );

	console.log( client.count, 'overleaf downloading zip' );
	const zipFile = await olops.downloadZip( client, olServer, project.id );

	console.log( client.count, 'unzipping to pad' );
	const directory = await unzipper.Open.buffer( zipFile );
	await directory.extract( { path: padDir } );
	console.log( client.count, 'unzipping to blue' );
	await directory.extract( { path: blueDir } );
};
