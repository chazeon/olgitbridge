/*
| Creates a new axios client to connect to overleaf.
*/
const axios = require( 'axios' );
const tough = require( 'tough-cookie' );
const axiosCookieJarSupport = require( 'axios-cookiejar-support' ).wrapper;

module.exports =
	function( )
{
	const cookieJar = new tough.CookieJar( );
	return axiosCookieJarSupport( axios.create( { jar: cookieJar } ) );
};
