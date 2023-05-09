/*
| Main file starting the server process of olgitbridge.
*/
//process.env.DEBUG = '*';
const config = require( '../config' );
const backend = require( 'git-http-backend' );
const downsync = require( './downsync' );
const fs = require( 'fs/promises' );
const git = require( './git' );
const http = require( 'http' );
const https = require( 'https' );
const olops = require( './olops' );
const Semaphore = require( './semaphore' );
const spawn = require( 'child_process' ).spawn;
const upsync = require( './upsync' );
const users = require( './users' );
const zlib = require ('zlib' );

const bluesDir = config.bluesDir;
const downSyncTimeout = config.downSyncTimeout;
const hashDir = config.hashDir;
const olServer = config.olServer;
const padsDir = config.padsDir;
const reposDir = config.reposDir;

// cache of handled projects
const projects = { };

// connection counter (for logging messages)
let counter = 0;

/*
| Handles the git request.
*/
const beginRemoteGitRequest =
	async function( err, service, client, project_id, res, auth, pflag )
{
	if( err ) return res.end( err + '\n' );
	console.log( client.count, 'begin serving remote git request' );
	const project = projects[ project_id ];

	res.setHeader( 'content-type', service.type );
	const args = service.args.concat( project.repoDir );

	console.log( client.count, 'git request', project_id, service.cmd, args );
	const cmd = service.cmd;
	if( cmd !== 'git-upload-pack' && cmd !== 'git-receive-pack' )
	{
		res.writeHead( 400, 'Bad Request' );
		res.end( );
		olops.logout( client, olServer );
		console.log( client.count, 'releasing project semaphore' );
		projects[ project_id ].semaphore.release( pflag );
		return;
	}

	// spawns the git request
	const ps = spawn( service.cmd, args );
	ps.stdout.pipe( service.createStream( ) ).pipe( ps.stdin );
	ps.on( 'close', ( ) => endRemoteGitRequest( client, project, cmd, auth, pflag ) );
};

/*
| Called after the git request has been server.
|
| Note that unless client sends in a second command it is returned already
| while olgitbridge still handles upsyncing the changes to overleaf.
*/
const endRemoteGitRequest =
	async function( client, project, cmd, auth, pflag )
{
	console.log( client.count, 'remote git request ended, pulling into pad' );
	await git.pull( project.padDir );
	if( cmd === 'git-receive-pack' )
	{
		console.log( client.count, 'upsyncing' );
		await upsync( client, olServer, project );
	}
	console.log( client.count, 'overleaf logout' );
	await olops.logout( client, olServer );
	console.log( client.count, 'releasing project semaphore' );
	project.semaphore.release( pflag );
	users.release( auth.email, auth.uflag );
	console.log( client.count, 'all done' );
};

/*
| Handles https authentication requests.
| and tries to login to overleaf using presented creds.
|
| ~req, res: request/result streams
| ~client: axios client to use
| ~project_id: to try creds on
|
| ~returns: true if user is authenticated and logged into overleaf
*/
const handleAuth =
	async function( req, res, client, project_id )
{
	let auth = req.headers.authorization;
	if( !auth )
	{
		console.log( client.count, 'requesting authorization' );
		res.writeHead( 401, { 'WWW-Authenticate': 'Basic realm="olgitbridge"' } );
		res.end( 'Authorization is needed' );
		return false;
	}
	auth = auth.replace(/^Basic /, '');
	auth = Buffer.from( auth, 'base64' ).toString( 'utf8' );
	auth = auth.split( ':' );
	const email = auth[ 0 ];
	const password = auth[ 1 ];
	console.log( client.count, 'requesting user semaphore' );
	const uflag = await users.get( email );

	console.log( client.count, 'auth email', email );
	console.log( client.count, 'overleaf login' );
	try
	{
		await olops.login( client, olServer, email, password );
		await olops.getProjectPage( client, olServer, project_id );
	}
	catch( e )
	{
		users.release( email, uflag );
		if( e.response.status === 401 )
		{
			res.writeHead( 401, 'Unauthorized' );
			res.end( );
			return;
		}
		// rethrows other errors
		throw e;
	}
	return Object.freeze({ email: email, uflag: uflag });
};

/*
| Prepares a project olgitbridge's data structure and it's working directories.
*/
const prepareProject =
	async function( count, project_id )
{
	let project = projects[ project_id ];
	if( !project )
	{
		project = projects[ project_id ] =
		{
			blueDir: bluesDir + project_id + '/',
			id: project_id,
			lastSync: undefined,
			// stores the hash of the last downloaded zip
			hashFilename: hashDir + project_id,
			padDir: padsDir + project_id + '/',
			repoDir: reposDir + project_id + '/',
			semaphore: new Semaphore( ),
		};
		const repoDir = project.repoDir;
		const blueDir = project.blueDir;
		const padDir = project.padDir;

		// creates the git bare repository
		try{ await fs.stat( repoDir ); }
		catch( e )
		{
			// rethrows anything but entity not found
			if( e.code !== 'ENOENT' ) throw e;
			await fs.mkdir( repoDir );
			await git.init( repoDir );
		}

		// creates the pad (git clone of repository)
		try{ await fs.stat( padDir ); }
		catch( e )
		{
			// rethrows anything but entity not found
			if( e.code !== 'ENOENT' ) throw e;
			await fs.mkdir( padDir );
			await git.clone( repoDir, padsDir );
		}

		// creates the blueprint (overleaf downloaded zip contents)
		try{ await fs.stat( blueDir ); }
		catch( e )
		{
			// rethrows anything but entity not found
			if( e.code !== 'ENOENT' ) throw e;
			await fs.mkdir( blueDir );
		}
	}

	// taking the semaphore for this project
	console.log( count, 'requesting project semaphore' );
	const pflag = await project.semaphore.request( );
	return pflag;
};

/*
| Handles a https connection requesting a git command to be executed.
*/
const serve =
	async function( req, res )
{
	const count = '[' + (++counter) + ']';
	const url = req.url;
	let project_id = url.split( '/' )[ 1 ];

	// cuts away the .git if given
	if( project_id.endsWith( '.git' ) )
	{
		project_id = project_id.substr( 0, project_id.length - 4 );
	}

	console.log( count, 'getting request for', project_id );

	const client = olops.client( );
	client.count = count;
	const auth = await handleAuth( req, res, client, project_id );
	if( !auth ) return;

	const pflag = await prepareProject( count, project_id );
	const project = projects[ project_id ];
	{
		const now = Date.now( );
		const lastSync = project.lastSync;
		if( !lastSync || now - lastSync >= downSyncTimeout )
		{
			project.lastSync = now;
			if( await downsync( client, olServer, project ) )
			{
				// downsync returns true if it wasnt cached
				await git.save( count, project.padDir, 'synced by olgitbridge' );
			}
		}
		else
		{
			// FIXME in case of git-receive-pack it should *ALWAYS* sync before.
			console.log( count, 'skipping downsync as last was ', (now - lastSync) / 1000 ,'s ago' );
		}
	}

	// potentially unzips body stream
	if( req.headers[ 'content-encoding' ] === 'gzip' )
	{
		req = req.pipe( zlib.createGunzip( ) );
	}

	req.pipe(
		backend( url, ( err, service ) =>
			beginRemoteGitRequest( err, service, client, project_id, res, auth, pflag )
		)
	).pipe( res );
};

const start =
	async function( )
{
	// creates the working dirs, ignores already exisiting errors
	for( let dir of [ reposDir, padsDir, bluesDir, hashDir ] )
	{
		try{ await fs.mkdir( dir ); }
		catch( e ) { if( e.code !== 'EEXIST' ) throw e; }
	}

	if( config.ssl.enable )
	{
		const httpsOptions =
		{
			key: await fs.readFile( config.ssl.key ),
			cert: await fs.readFile( config.ssl.cert ),
		};
		// starts the server
		https.createServer( httpsOptions, serve ).listen( config.port );
	}
	else
	{
		http.createServer( serve ).listen( config.port );
	}
	console.log( '[*] listening on port', config.port );

	// forwards http requests to https
	if( config.forward.enable )
	{
		http.createServer( ( req, res ) =>
		{
			let url = req.url.split( '/' );
			url.unshift( );
			res.writeHead( 307,
				{ Location: config.forward.target + '/' + url.join( '/' ) }
			);
			res.end( 'go use https' );
		} ).listen( config.forward.port );
	}
};

start( );
