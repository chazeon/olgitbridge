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

	console.log( client.count, 'overleaf downloading zip' );
	const zipFile = await olops.downloadZip( client, olServer, project.id );
	const directory = await unzipper.Open.buffer( zipFile );

	// creates a hash of the zip
	// ( cannot create a hash of the whole buffer, since its always different
	//   due to creation timestamps )

	let hash = '';
	for( let file of directory.files )
	{
		hash +=
			file.path
			+ ':' + file.uncompressedSize
			+ ':' + file.crc32
			+ '\n';
	}
	try
	{
		const oldHash = ( await fs.readFile( project.hashFilename ) ) + '';
		if( oldHash === hash )
		{
			console.log( client.count, 'hash identical, skipping download/sync' );
			return false;
		}
	}
	catch( e )
	{
		// ignore, assume no cache
	}

	console.log( client.count, 'emptying pad & blue' );
	await emptyDir( padDir, true );
	await emptyDir( blueDir, false );

	console.log( client.count, 'unzipping to pad' );
	await directory.extract( { path: padDir } );
	console.log( client.count, 'unzipping to blue' );
	await directory.extract( { path: blueDir } );

	await fs.writeFile( project.hashFilename, hash );
	return true;
};
